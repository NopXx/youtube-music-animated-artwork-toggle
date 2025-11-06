// Background script สำหรับจัดการ API calls
// ใช้เพื่อหลีกเลี่ยง CORS errors ใน content script

// ตรวจสอบ extension context
function checkExtensionContext() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}

// ฟังก์ชันค้นหา Apple Music URL
async function searchAppleMusicUrl(songTitle, artist, album) {
  try {
    const baseNormalize = (value) => (value ?? '').toString().toLowerCase().trim();
    const stripParentheses = (value) => baseNormalize(value).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

    const sanitizeTrackOrAlbum = (value) => stripParentheses(value)
      .replace(/ร่วมกับ/gi, ' ')
      .replace(/\b(feat\.?|ft\.?|with)\b/gi, ' ')
      .replace(/\b(explicit|clean)\b/gi, ' ')
      .replace(/\b(ver\.?|version)\b/gi, ' ')
      .replace(/[-–—]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const extractParenthesisValues = (value) => {
      const matches = [...(value ?? '').toString().matchAll(/\(([^)]+)\)/g)];
      return matches.map((match) => baseNormalize(match[1]).replace(/\s+/g, ' ').trim()).filter(Boolean);
    };

    const createComparableValues = (value, { removeDecorations = false } = {}) => {
      const normalized = baseNormalize(value);
      if (!normalized) {
        return [];
      }

      const values = new Set();
      const addValue = (val) => {
        if (!val) return;
        const trimmed = val.replace(/\s+/g, ' ').trim();
        if (!trimmed) return;
        values.add(trimmed);
        values.add(trimmed.replace(/\s+/g, ''));
      };

      addValue(normalized);

      const noParentheses = normalized.replace(/\([^)]*\)/g, ' ');
      addValue(noParentheses);

      normalized.split(/[,/&]/).forEach((part) => addValue(part));
      normalized.split(/[-–—]/).forEach((part) => addValue(part));

      extractParenthesisValues(value).forEach((part) => addValue(part));

      if (removeDecorations) {
        addValue(sanitizeTrackOrAlbum(value));
      }

      return Array.from(values);
    };

    const valuesOverlap = (aValues, bValues) => {
      if (!aValues.length || !bValues.length) {
        return false;
      }
      return aValues.some((aVal) =>
        bValues.some((bVal) => aVal && bVal && (aVal === bVal || aVal.includes(bVal) || bVal.includes(aVal)))
      );
    };

    const buildSearchTerms = () => {
      const terms = new Set();
      const addTerm = (...parts) => {
        const term = parts
          .flat()
          .map((part) => (part ?? '').toString().trim())
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (term) {
          terms.add(term);
        }
      };

      const sanitizedArtist = stripParentheses(artist);
      const sanitizedTrack = sanitizeTrackOrAlbum(songTitle);
      const sanitizedAlbum = sanitizeTrackOrAlbum(album);
      const artistAlternatives = extractParenthesisValues(artist);

      addTerm(artist, album, songTitle);
      addTerm(artist, songTitle);
      addTerm(artist, sanitizedTrack);
      addTerm(sanitizedArtist, sanitizedTrack);
      addTerm(sanitizedArtist, sanitizedAlbum, sanitizedTrack);
      addTerm(sanitizedArtist, sanitizedAlbum);
      addTerm(sanitizedTrack);

      artistAlternatives.forEach((alt) => {
        addTerm(alt, sanitizedTrack);
        addTerm(alt, sanitizedAlbum, sanitizedTrack);
      });

      if (sanitizedAlbum) {
        addTerm(sanitizedAlbum, sanitizedTrack);
      }

      return Array.from(terms);
    };

    const executeSearch = async (term, country) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const encodedTerm = encodeURIComponent(term);

      try {
        const countryParam = country ? `&country=${country}` : '';
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodedTerm}&entity=musicTrack&media=music&limit=4${countryParam}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          return { error: `iTunes API returned status: ${response.status}` };
        }

        const responseText = await response.text();
        console.log('iTunes API response:', responseText);

        const data = JSON.parse(responseText);
        const results = Array.isArray(data.results) ? data.results : [];
        return { results };
      } catch (error) {
        if (error.name === 'AbortError') {
          return { error: 'iTunes search timeout' };
        }
        return { error: error.message };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const findBestMatch = (results) => {
      if (!results.length) {
        return null;
      }

      const targetArtistValues = createComparableValues(artist);
      const targetTrackValues = createComparableValues(songTitle, { removeDecorations: true });
      const targetAlbumValues = album ? createComparableValues(album, { removeDecorations: true }) : [];

      const evaluateItem = (item) => {
        const itemArtistValues = createComparableValues(item.artistName);
        const itemTrackValues = createComparableValues(item.trackName, { removeDecorations: true });
        const itemAlbumValues = createComparableValues(item.collectionName, { removeDecorations: true });

        const artistMatch = valuesOverlap(targetArtistValues, itemArtistValues);
        const trackMatch = valuesOverlap(targetTrackValues, itemTrackValues);
        const albumMatch = !targetAlbumValues.length || valuesOverlap(targetAlbumValues, itemAlbumValues);

        return { artistMatch, trackMatch, albumMatch };
      };

      const rankedResults = results.map((item) => {
        const { artistMatch, trackMatch, albumMatch } = evaluateItem(item);
        const score =
          (artistMatch ? 3 : 0) +
          (trackMatch ? 5 : 0) +
          (albumMatch ? 1 : 0);
        return { item, artistMatch, trackMatch, albumMatch, score };
      });

      const perfectMatch = rankedResults.find(
        ({ artistMatch, trackMatch, albumMatch }) => artistMatch && trackMatch && albumMatch
      );
      if (perfectMatch) {
        return perfectMatch.item;
      }

      const strongMatch = rankedResults
        .filter(({ trackMatch }) => trackMatch)
        .sort((a, b) => b.score - a.score)[0];
      return strongMatch ? strongMatch.item : results[0];
    };

    const searchTerms = buildSearchTerms();
    if (!searchTerms.length) {
      return { error: 'No search terms provided' };
    }

    // ดึง preferredCountry จาก storage
    const storedSettings = await chrome.storage.sync.get(['preferredCountry']);
    const preferredCountry = storedSettings.preferredCountry;

    let countryPriority = ['us', 'kr', 'th', 'jp']; // Default priority
    if (preferredCountry && preferredCountry !== 'auto') {
      countryPriority = [preferredCountry, ...countryPriority.filter(c => c !== preferredCountry)];
    }

    let lastResults = [];
    let lastError = null;

    for (const country of countryPriority) {
      for (const term of searchTerms) {
        const { results = [], error } = await executeSearch(term, country);
        if (error) {
          lastError = error;
          continue;
        }

        if (!results.length) {
          continue;
        }

        const matchedItem = findBestMatch(results);
        if (matchedItem?.trackViewUrl) {
          return { success: true, url: matchedItem.trackViewUrl };
        }

        if (!lastResults.length) {
          lastResults = results;
        }
      }

      if (lastResults.length) {
        break;
      }
    }

    const fallbackUrl = lastResults[0]?.trackViewUrl;
    if (fallbackUrl) {
      return { success: true, url: fallbackUrl };
    }

    return lastError ? { error: lastError } : { error: 'No results found' };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'iTunes search timeout' };
    }
    return { error: error.message };
  }
}

// ฟังก์ชันดึง animated artwork จาก API
async function getAnimatedArtwork(appleMusicUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://clients.dodoapps.io/playlist-precis/playlist-artwork.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        url: appleMusicUrl,
        animation: 'true'
      }).toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('response status:', response.status, 'ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      return { error: `Animated artwork API returned status: ${response.status}` };
    }

    const data = await response.json();

    if (data.animatedUrl1080 || data.animatedUrl) {
      return { success: true, url: data.animatedUrl1080 || data.animatedUrl };
    }

    return { error: 'No animated artwork available' };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'Animated artwork fetch timeout' };
    }
    return { error: error.message };
  }
}

// รับฟังข้อความจาก content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (!checkExtensionContext()) {
    sendResponse({ error: 'Extension context invalidated' });
    return false;
  }

  // ค้นหา Apple Music URL
  if (request.action === 'searchAppleMusic') {
    searchAppleMusicUrl(request.title, request.artist, request.album)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }

  // ดึง animated artwork
  if (request.action === 'getAnimatedArtwork') {
    getAnimatedArtwork(request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }

  return false;
});

console.log('YouTube Music Animated Artwork - Background script loaded');
