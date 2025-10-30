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
    // จัดรูปแบบเป็น artist,album,track และแทนที่ช่องว่างด้วย +
    const formattedArtist = artist.replace(/\s+/g, '+');
    const formattedAlbum = album ? album.replace(/\s+/g, '+') : '';
    const formattedTrack = songTitle.replace(/\s+/g, '+');

    const searchQuery = album
      ? `${formattedArtist},${formattedAlbum},${formattedTrack}`
      : `${formattedArtist},${formattedTrack}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://itunes.apple.com/search?term=${searchQuery}&entity=song&limit=10`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { error: `iTunes API returned status: ${response.status}` };
    }

    const data = await response.json();

    const results = Array.isArray(data.results) ? data.results : [];

    if (results.length > 0) {
      const normalize = (value) => (value ?? '').toString().trim().toLowerCase();
      const targetArtist = normalize(artist);
      const targetTrack = normalize(songTitle);
      const targetAlbum = normalize(album);

      const matchedItem = results.find(item => {
        const artistMatch = normalize(item.artistName) === targetArtist;
        const trackMatch = normalize(item.trackName) === targetTrack;
        const albumMatch = targetAlbum
          ? normalize(item.collectionName).includes(targetAlbum)
          : true;
        return artistMatch && trackMatch && albumMatch;
      });

      if (matchedItem?.trackViewUrl) {
        return { success: true, url: matchedItem.trackViewUrl };
      }

      const fallbackUrl = results[0]?.trackViewUrl;
      if (fallbackUrl) {
        return { success: true, url: fallbackUrl };
      }
    }

    return { error: 'No results found' };
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
