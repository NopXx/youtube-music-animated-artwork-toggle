# YouTube Music Animated Artwork Toggle (ภาษาไทย)

ส่วนขยาย Chrome สำหรับแสดง animated album artwork จาก Apple Music บน YouTube Music และสามารถสลับเปิด/ปิดได้จาก popup อย่างรวดเร็ว

## คุณสมบัติเด่น

- แสดง animated artwork แบบวิดีโอคุณภาพสูงในทันที
- ค้นหาเพลงบน Apple Music ด้วยการเทียบข้อมูลแบบ case-insensitive และรองรับชื่ออัลบั้มที่มีคำต่อท้าย (เช่น Deluxe Edition)
- เมื่อไม่พบวิดีโอจะกลับไปใช้ภาพนิ่งอัตโนมัติ ลดปัญหาวิดีโอค้างจากเพลงก่อนหน้า
- บันทึกสถานะเปิด/ปิดผ่าน Chrome Storage

## การติดตั้ง (โหมดนักพัฒนา)

1. ดาวน์โหลดหรือ `git clone` โฟลเดอร์ `youtube-music-artwork-toggle`
2. เปิด Chrome แล้วไปที่ `chrome://extensions/`
3. เปิด **Developer mode** (ปุ่มด้านขวาบน)
4. คลิก **Load unpacked** และเลือกโฟลเดอร์โปรเจ็กต์นี้
5. (ทางเลือก) หากต้องการสร้างไอคอนใหม่ เปิด `icons/create-icons.html` แล้วกด "Download Icons" เพื่อนำไฟล์ไปวางไว้ในโฟลเดอร์ `icons/`

## วิธีใช้งาน

1. เปิด https://music.youtube.com และเริ่มเล่นเพลง
2. คลิกไอคอนส่วนขยายบนแถบเครื่องมือของ Chrome
3. ใช้สวิตช์ toggle เพื่อเปิดหรือปิดการใช้งาน animated artwork
4. เมื่อเปิดใช้งาน ส่วนขยายจะค้นหาเพลงบน Apple Music และสลับ artwork เป็นวิดีโอโดยอัตโนมัติหากพบข้อมูล

## โครงสร้างไฟล์หลัก

```
youtube-music-artwork-toggle/
├── background.js       # สคริปต์พื้นหลัง: ค้นหา Apple Music และดึง animated artwork
├── content.js          # ทำงานบนหน้า YouTube Music: ตรวจเพลงปัจจุบันและจัดการ DOM
├── manifest.json       # Chrome Extension Manifest V3
├── popup.html/.css/.js # ส่วนติดต่อผู้ใช้และสวิตช์ toggle
├── styles.css          # สไตล์เพิ่มเติมสำหรับ content script
└── icons/              # ไฟล์ไอคอนและเครื่องมือสร้างไอคอน
```

## เคล็ดลับสำหรับการพัฒนา

- ทดสอบการบันทึกสถานะด้วยการปิด/เปิด toggle หลายครั้ง (ข้อมูลเก็บใน `chrome.storage.local`)
- ลองเล่นเพลงที่มีหรือไม่มี animated artwork เพื่อตรวจสอบการ fallback กลับไปใช้ภาพนิ่ง
- หากต้องการ debug เพิ่มเติม สามารถเปิด DevTools ในแท็บ YouTube Music และเปิดคอนโซลของ service worker ที่ `chrome://extensions/`

## หมายเหตุ

- ทำงานเฉพาะบน `https://music.youtube.com`
- หาก Apple Music ไม่ส่ง animated artwork กลับมา ส่วนขยายจะคืนค่าภาพนิ่งทันที
- Apple Music API อาจมีการจำกัดอัตราเรียกใช้งานหรือเกิด timeout ได้ ควรตรวจสอบ log หากพบปัญหา

## License

MIT License
