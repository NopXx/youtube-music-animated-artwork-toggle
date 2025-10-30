// Content script สำหรับ YouTube Music Animated Artwork

let currentSongInfo = null;
let videoElement = null;
let originalArtwork = null;

// ฟังก์ชันดึงข้อมูลเพลงจาก YouTube Music
function getCurrentSongInfo() {
  const titleElement = document.querySelector('.title.ytmusic-player-bar');
  const artistElement = document.querySelector('.subtitle.ytmusic-player-bar a[href*="channel"]');
  const albumElement = document.querySelector('.subtitle.ytmusic-player-bar a[href*="browse"]');

  if (titleElement && artistElement) {
    return {
      title: titleElement.textContent.trim(),
      artist: artistElement.textContent.trim(),
      album: albumElement ? albumElement.textContent.trim() : ''
    };
  }
  return null;
}

// ฟังก์ชันค้นหา Apple Music URL ผ่าน background script
async function searchAppleMusicUrl(songTitle, artist, album) {
  // ตรวจสอบ extension context
  if (!checkExtensionContext()) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      // ส่งข้อความไปยัง background script เพื่อหลีกเลี่ยง CORS
      chrome.runtime.sendMessage({
        action: 'searchAppleMusic',
        title: songTitle,
        artist: artist,
        album: album
      }, (response) => {
        // ตรวจสอบ errors
        if (chrome.runtime.lastError) {
          console.log('Background script error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }

        if (!response) {
          console.log('No response from background script');
          resolve(null);
          return;
        }

        if (response.success && response.url) {
          resolve(response.url);
        } else if (response.error) {
          console.log('iTunes search error:', response.error);
          resolve(null);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.log('Error communicating with background script:', error.message);
      resolve(null);
    }
  });
}

// ฟังก์ชันดึง animated artwork จาก API ผ่าน background script
async function getAnimatedArtwork(appleMusicUrl) {
  // ตรวจสอบ extension context
  if (!checkExtensionContext()) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      // ส่งข้อความไปยัง background script เพื่อหลีกเลี่ยง CORS
      chrome.runtime.sendMessage({
        action: 'getAnimatedArtwork',
        url: appleMusicUrl
      }, (response) => {
        // ตรวจสอบ errors
        if (chrome.runtime.lastError) {
          console.log('Background script error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }

        if (!response) {
          console.log('No response from background script');
          resolve(null);
          return;
        }

        if (response.success && response.url) {
          resolve(response.url);
        } else if (response.error) {
          console.log('Animated artwork error:', response.error);
          resolve(null);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.log('Error communicating with background script:', error.message);
      resolve(null);
    }
  });
}

// ฟังก์ชันแสดง animated artwork
function displayAnimatedArtwork(videoUrl) {
  const playerContainer = document.getElementById('player');

  if (!playerContainer) {
    console.log('Player container not found');
    return;
  }

  // ค้นหา artwork container
  const artworkContainer = playerContainer.querySelector('.image.ytmusic-player-page') ||
                          playerContainer.querySelector('#song-image') ||
                          playerContainer.querySelector('.player-page-image');

  if (!artworkContainer) {
    console.log('Artwork container not found');
    return;
  }

  // บันทึก original artwork ถ้ายังไม่ได้บันทึก
  if (!originalArtwork) {
    originalArtwork = artworkContainer.cloneNode(true);
  }

  // ลบ video element เก่าถ้ามี
  if (videoElement) {
    videoElement.remove();
  }

  // สร้าง video element ใหม่
  videoElement = document.createElement('video');
  videoElement.src = videoUrl;
  videoElement.autoplay = true;
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 10;
    border-radius: inherit;
  `;

  // ตั้งค่า container ให้เป็น relative
  if (artworkContainer.style.position !== 'relative') {
    artworkContainer.style.position = 'relative';
  }

  // เพิ่ม video element
  artworkContainer.appendChild(videoElement);

  console.log('Animated artwork displayed:', videoUrl);
}

// ฟังก์ชันกู้คืน artwork เดิม
function restoreOriginalArtwork() {
  if (videoElement) {
    videoElement.remove();
    videoElement = null;
  }
}

// ตรวจสอบว่า extension context ยังใช้งานได้
function checkExtensionContext() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}

// ฟังก์ชันหลักในการโหลด animated artwork
async function loadAnimatedArtwork() {
  // ตรวจสอบ extension context ก่อน
  if (!checkExtensionContext()) {
    console.log('Extension context lost. Please refresh the page.');
    return;
  }

  try {
    // ตรวจสอบว่าเปิดใช้งานหรือไม่
    const settings = await chrome.storage.local.get(['animatedEnabled']);
    if (!settings.animatedEnabled) {
      restoreOriginalArtwork();
      return;
    }
  } catch (error) {
    console.error('Error accessing storage:', error.message);
    return;
  }

  const songInfo = getCurrentSongInfo();

  if (!songInfo) {
    console.log('Song info not available');
    return;
  }

  // ตรวจสอบว่าเป็นเพลงเดิมหรือไม่
  if (currentSongInfo &&
      currentSongInfo.title === songInfo.title &&
      currentSongInfo.artist === songInfo.artist &&
      currentSongInfo.album === songInfo.album) {
    return;
  }

  currentSongInfo = songInfo;
  console.log('New song detected:', songInfo);

  // ค้นหา Apple Music URL
  const appleMusicUrl = await searchAppleMusicUrl(songInfo.title, songInfo.artist, songInfo.album);

  // ตรวจสอบ context อีกครั้งหลัง async operation
  if (!checkExtensionContext()) {
    return;
  }

  if (!appleMusicUrl) {
    console.log('Apple Music URL not found');
    restoreOriginalArtwork();
    return;
  }

  console.log('Apple Music URL found:', appleMusicUrl);

  // ดึง animated artwork
  const animatedUrl = await getAnimatedArtwork(appleMusicUrl);

  // ตรวจสอบ context อีกครั้งหลัง async operation
  if (!checkExtensionContext()) {
    return;
  }

  if (animatedUrl) {
    displayAnimatedArtwork(animatedUrl);
  } else {
    console.log('Animated artwork not available for this song');
    restoreOriginalArtwork();
  }
}

// ตรวจสอบการเปลี่ยนเพลง
const observer = new MutationObserver(function(mutations) {
  if (checkExtensionContext()) {
    loadAnimatedArtwork();
  }
});

// เริ่มสังเกตการเปลี่ยนแปลง
const targetNode = document.querySelector('.ytmusic-player-bar');
if (targetNode) {
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// โหลดครั้งแรก
setTimeout(() => {
  if (checkExtensionContext()) {
    loadAnimatedArtwork();
  }
}, 2000);

// รับฟังข้อความจาก popup
if (checkExtensionContext()) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // ตรวจสอบ context ทุกครั้งที่รับ message
    if (!checkExtensionContext()) {
      console.log('Extension context lost. Please refresh the page.');
      sendResponse({ success: false, error: 'Extension context invalidated' });
      return false;
    }

    try {
      if (request.action === 'toggleAnimated') {
        chrome.storage.local.set({ animatedEnabled: request.enabled }, function() {
          if (!checkExtensionContext()) {
            return;
          }
          if (chrome.runtime.lastError) {
            console.error('Error saving state:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }

          if (request.enabled) {
            loadAnimatedArtwork();
          } else {
            restoreOriginalArtwork();
          }
          sendResponse({ success: true, enabled: request.enabled });
        });
        return true; // Keep message channel open for async response
      } else if (request.action === 'getState') {
        chrome.storage.local.get(['animatedEnabled'], function(result) {
          if (!checkExtensionContext()) {
            return;
          }
          if (chrome.runtime.lastError) {
            console.error('Error getting state:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          sendResponse({ success: true, animatedEnabled: result.animatedEnabled || false });
        });
        return true; // Keep message channel open for async response
      }
    } catch (error) {
      console.error('Error in message listener:', error.message);
      sendResponse({ success: false, error: error.message });
    }
    return false;
  });
}
