// Options script สำหรับ YouTube Music Artwork Toggle

// ตรวจสอบ extension context
function checkExtensionContext() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const preferredCountrySelect = document.getElementById('preferredCountry');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');
  const hideFullscreenToggle = document.getElementById('hideFullscreenToggle');
  const fullscreenToggleLabel = document.getElementById('fullscreenToggleLabel');

  // รายการประเทศที่รองรับ (สามารถเพิ่มได้ตามต้องการ)
  const countries = [
    { code: 'us', name: 'United States' },
    { code: 'th', name: 'Thailand' },
    { code: 'kr', name: 'South Korea' },
    { code: 'jp', name: 'Japan' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ca', name: 'Canada' },
    { code: 'au', name: 'Australia' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'auto', name: 'Auto-detect (Default)' } // เพิ่มตัวเลือกสำหรับให้ background script จัดการเอง
  ];

  // Populate dropdown
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country.code;
    option.textContent = country.name;
    preferredCountrySelect.appendChild(option);
  });

  // โหลดการตั้งค่าที่บันทึกไว้
  function loadSettings() {
    if (!checkExtensionContext()) {
      statusMessage.textContent = 'Extension context lost. Please reopen options page.';
      statusMessage.style.color = 'red';
      return;
    }
    chrome.storage.sync.get(['preferredCountry', 'hideFullscreen'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        statusMessage.textContent = 'Error loading settings.';
        statusMessage.style.color = 'red';
        return;
      }
      // โหลดค่าประเทศ
      const savedCountry = result.preferredCountry || 'auto'; // Default to 'auto'
      preferredCountrySelect.value = savedCountry;

      // โหลดค่าซ่อนปุ่ม fullscreen (default to true)
      const shouldHide = result.hideFullscreen !== false;
      hideFullscreenToggle.checked = shouldHide;
      updateFullscreenLabel(shouldHide);
    });
  }

  // บันทึกการตั้งค่า
  saveButton.addEventListener('click', function() {
    if (!checkExtensionContext()) {
      statusMessage.textContent = 'Extension context lost. Please reopen options page.';
      statusMessage.style.color = 'red';
      return;
    }
    const selectedCountry = preferredCountrySelect.value;
    const shouldHideFullscreen = hideFullscreenToggle.checked;

    chrome.storage.sync.set({
      preferredCountry: selectedCountry,
      hideFullscreen: shouldHideFullscreen
    }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        statusMessage.textContent = 'Error saving settings.';
        statusMessage.style.color = 'red';
        return;
      }
      statusMessage.textContent = 'Settings saved!';
      statusMessage.style.color = 'lightgreen';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  });

  // อัปเดต label ของ fullscreen toggle
  function updateFullscreenLabel(isChecked) {
    fullscreenToggleLabel.textContent = isChecked ? 'Hide when animated' : 'Always show';
  }

  hideFullscreenToggle.addEventListener('change', function() {
    updateFullscreenLabel(this.checked);
  });

  // โหลดการตั้งค่าเมื่อหน้าเว็บโหลดเสร็จ
  loadSettings();
});

console.log('YouTube Music Animated Artwork - Options script loaded');