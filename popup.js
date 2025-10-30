// Popup script สำหรับ YouTube Music Artwork Toggle

// ฟังก์ชันแสดงหน้าจอ error เมื่อ extension context หาย
function showInvalidContextError() {
  const mainContent = document.getElementById('mainContent');
  const errorContainer = document.getElementById('errorContainer');
  if (mainContent && errorContainer) {
    mainContent.style.display = 'none';
    errorContainer.style.display = 'flex';
  }
}

// ตรวจสอบ extension context ก่อนทำอะไร
function checkExtensionContext() {
  try {
    // พยายามเข้าถึง chrome.runtime.id
    if (!chrome.runtime?.id) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // ตรวจสอบว่า extension context ยังใช้งานได้
  if (!checkExtensionContext()) {
    showInvalidContextError();
    return;
  }

  const toggle = document.getElementById('animatedToggle');
  const label = document.getElementById('toggleLabel');

  // โหลดสถานะปัจจุบัน
  try {
    chrome.storage.local.get(['animatedEnabled'], function(result) {
      if (!checkExtensionContext()) {
        showInvalidContextError();
        return;
      }
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        return;
      }
      const isEnabled = result.animatedEnabled || false;
      toggle.checked = isEnabled; // checked = เปิดใช้งาน animated
      updateLabel(isEnabled);
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
    showInvalidContextError();
  }

  // อัปเดต label
  function updateLabel(isEnabled) {
    label.textContent = isEnabled ? 'Animated On' : 'Animated Off';
  }

  // จัดการการคลิก toggle
  toggle.addEventListener('change', function() {
    // ตรวจสอบ extension context อีกครั้ง
    if (!checkExtensionContext()) {
      toggle.checked = !toggle.checked; // คืนค่าเดิม
      showInvalidContextError();
      return;
    }

    const isEnabled = toggle.checked;

    updateLabel(isEnabled);

    // บันทึกสถานะลง storage
    try {
      chrome.storage.local.set({ animatedEnabled: isEnabled }, function() {
        if (!checkExtensionContext()) {
          showInvalidContextError();
          return;
        }
        if (chrome.runtime.lastError) {
          console.error('Error saving settings:', chrome.runtime.lastError);
        }
      });

      // ส่งข้อความไปยัง content script
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!checkExtensionContext()) {
          showInvalidContextError();
          return;
        }
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError);
          return;
        }

        if (tabs[0] && tabs[0].url && tabs[0].url.includes('music.youtube.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleAnimated',
            enabled: isEnabled
          }, function(response) {
            if (!checkExtensionContext()) {
              return; // ไม่แสดง error ซ้ำ
            }
            if (chrome.runtime.lastError) {
              console.log('Content script not ready:', chrome.runtime.lastError.message);
              console.log('Please refresh the YouTube Music page if needed');
            } else {
              console.log('Toggle successful:', response);
            }
          });
        } else {
          console.log('Not on YouTube Music. Settings saved for next visit.');
        }
      });
    } catch (error) {
      console.error('Error in toggle handler:', error);
      showInvalidContextError();
    }
  });
});
