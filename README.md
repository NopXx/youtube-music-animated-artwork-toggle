# YouTube Music Animated Artwork Toggle

ส่วนขยาย Chrome ที่ช่วยดึงและแสดงผล animated album artwork จาก Apple Music ให้กับเพลงที่กำลังเล่นบนหน้า YouTube Music โดยสามารถสลับเปิด/ปิดได้ทันทีจาก popup ของส่วนขยาย

## Highlights

- แสดงผล animated artwork แบบ real-time ด้วยวิดีโอที่มีคุณภาพสูง
- ดึงข้อมูลจาก Apple Music API พร้อมตรวจสอบความตรงกันของเพลงแบบ case-insensitive และรองรับชื่ออัลบั้มที่มีคำต่อท้าย (Deluxe Edition ฯลฯ)
- มี fallback กลับไปใช้ artwork ปกติทันทีเมื่อไม่พบวิดีโอสำหรับเพลงถัดไป ลดอาการค้างคาของวิดีโอเดิม
- จำสถานะการเปิด/ปิดของผู้ใช้ใน Chrome Storage

## การติดตั้ง (โหมดนักพัฒนา)

1. ดาวน์โหลดหรือ `git clone` โฟลเดอร์ `youtube-music-artwork-toggle`
2. เปิด Chrome ไปที่ `chrome://extensions/`
3. เปิด "Developer mode" (ปุ่มด้านขวาบน)
4. คลิก "Load unpacked" แล้วเลือกโฟลเดอร์โปรเจ็กต์นี้
5. (ตัวเลือก) หากต้องการสร้างไอคอนใหม่ เปิด `icons/create-icons.html` แล้วคลิก "Download Icons" เพื่อนำไฟล์ไปวางไว้ในโฟลเดอร์ `icons/`

## วิธีใช้งาน

1. เปิด https://music.youtube.com และเริ่มเล่นเพลง
2. คลิกไอคอนส่วนขยายบน Chrome toolbar
3. ใช้ toggle เพื่อเปิด/ปิดการใช้งาน animated artwork
4. เมื่อเปิดใช้งาน ส่วนขยายจะค้นหา Apple Music URL ที่ตรงกับเพลงปัจจุบันและสลับ artwork ให้โดยอัตโนมัติ

## โครงสร้างไฟล์หลัก

```
youtube-music-artwork-toggle/
├── background.js       # ทำงานใน background: ค้นหา Apple Music และดึง animated artwork
├── content.js          # รันบนหน้า YouTube Music: ตรวจเพลง, สลับ artwork, จัดการ DOM
├── manifest.json       # Chrome Extension Manifest V3
├── popup.html/.css/.js # UI toggle สำหรับผู้ใช้
├── styles.css          # สไตล์เพิ่มเติมสำหรับฝั่ง content script
└── icons/              # ไฟล์ไอคอนและเครื่องมือสร้างไอคอน
```

## การพัฒนา

- ปิดและเปิด toggle เพื่อทดสอบสถานะการบันทึกใน `chrome.storage.local`
- ทดลองเล่นเพลงที่มี/ไม่มี animated artwork เพื่อตรวจสอบการ fallback กลับไปยังภาพนิ่ง
- หากต้องการ debug เพิ่มเติม สามารถเปิด DevTools ในหน้า YouTube Music (แท็บ Console) และในพื้นหลังส่วนขยาย (`chrome://extensions/` > คลิก Service Worker)

## ข้อควรทราบ

- ทำงานเฉพาะบน `music.youtube.com`
- หากไม่พบ Apple Music URL หรือ animated artwork ส่วนขยายจะคืนค่า artwork ปกติให้โดยอัตโนมัติ
- Apple Music API มีการจำกัดจำนวนคำค้นหาและความเร็วการตอบกลับ ควรตรวจสอบ log หากเกิด timeout

## License

โค้ดเผยแพร่ภายใต้ MIT License ใช้งาน แก้ไข และแจกจ่ายได้อย่างอิสระ
