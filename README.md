# FB Ads Tracker (BIGCAT)

เว็บบันทึกแชทที่มาจาก Facebook Ads + Dashboard ต้นทุน/funnel แทนชีต "ระบบเก็บข้อมูล Funnel จาก Facebook Ads"

- หน้าเว็บ: HTML/CSS/JS ล้วน ไม่ต้อง build — วางบน GitHub Pages
- หลังบ้าน: Google Apps Script + Google Sheet ไฟล์ใหม่
- ยังไม่ใส่ `API_URL` = เปิดใน **โหมดตัวอย่าง** (ข้อมูลจำลอง) ดูหน้าตาได้ทันที

```
index.html
assets/css/style.css
assets/js/config.js      ← ใส่ API_URL ตรงนี้
assets/js/api.js         เรียก Apps Script / จำลองในเบราว์เซอร์
assets/js/calc.js        กติกาการนับทั้งหมด (funnel, lead ซ้ำ, KPI, ข้อความสรุป)
assets/js/charts.js      กราฟ SVG
assets/js/app.js         หน้าจอทั้งหมด
assets/js/demo-data.js   ข้อมูลจำลอง
apps-script/Code.gs      หลังบ้าน
apps-script/appsscript.json
```

## ติดตั้ง (ประมาณ 15 นาที)

### 1) หลังบ้าน — Google Sheet + Apps Script
1. สร้าง Google Sheet ใหม่ ตั้งชื่อเช่น `FB Ads Tracker – DB`
2. เมนู **Extensions → Apps Script** → ลบโค้ดเดิม วางเนื้อหา `apps-script/Code.gs`
3. (ถ้าอยากตั้งเขตเวลา) Project Settings → ติ๊ก *Show "appsscript.json"* → วางเนื้อหา `apps-script/appsscript.json`
4. แก้ `FIRST_USER` บรรทัดบน ๆ เป็นชื่อ/PIN ของตัวเอง
5. เลือกฟังก์ชัน `setup` → **Run** (ครั้งแรกจะขออนุญาต กด Allow)
6. เลือก `createFirstUser` → **Run**
7. (ย้ายข้อมูลเก่า) เลือก `importFromOldSheet` → **Run** — อ่านชีตเดิมแบบอ่านอย่างเดียว ไม่แก้ชีตเดิม
8. **Deploy → New deployment** → ประเภท *Web app*
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก URL ที่ลงท้าย `/exec`

> แก้ Code.gs ภายหลัง ต้อง **Deploy → Manage deployments → ✎ → Version: New version** ทุกครั้ง URL เดิมจึงจะได้โค้ดใหม่

### 2) หน้าเว็บ — GitHub Pages
1. เปิด `assets/js/config.js` ใส่ `API_URL: 'https://script.google.com/macros/s/.../exec'`
2. push ทั้งโฟลเดอร์ขึ้น repo
3. repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/ (root)` → Save
4. รอ 1–2 นาที เปิด `https://<user>.github.io/<repo>/`

## ใช้งาน
- **บันทึกแชท**: พิมพ์ชื่อ → เลือกโฆษณา (Ad set/แคมเปญเติมเอง) → กดสถานะ → บันทึก เคส *5-ปิดการขาย* ต้องใส่ยอดรับซื้อ
- **ค่า Ads**: กรอกรายวัน หรือยอดทั้งเดือนลงวันที่ 1
- **Dashboard**: เลือกช่วงวันที่/แคมเปญ ปุ่ม *คัดลอกสรุป* ได้ข้อความสรุปแคมเปญพร้อมวางใน LINE
- **ตั้งค่า**: เพิ่ม/ปิดโฆษณา ลิงก์โพสต์ที่บูสต์ รูปครีเอทีฟ เป้าต้นทุน/เคส ผู้ใช้/PIN

## กติกาการนับ (อยู่ใน `assets/js/calc.js`)
| สถานะ | ขั้นสูงสุด |
|---|---|
| 1-ทักแล้วเงียบ | 1 |
| 2-มีข้อมูลเครื่อง, X-ของไม่ตรง | 2 |
| 3-ประเมินราคาแล้ว, 7-สินค้าไม่รับซื้อ | 3 |
| 4-นัดรับของ | 4 |
| 5-ปิดการขาย | 5 |
| 6-ขอซื้อสินค้า | ไม่เข้า funnel (นับเป็น Lead ฝั่งขาย) |

ชื่อลูกค้าเดียวกันในแคมเปญเดียวกัน = 1 คน (ใช้แถวที่ไปได้ไกลสุด)

## ความปลอดภัย
- PIN เก็บเป็น SHA-256, token เซ็นด้วย HMAC อายุ 30 วัน
- Google Sheet หลังบ้านอย่าแชร์สาธารณะ — เว็บเข้าผ่าน Apps Script เท่านั้น
- ทุกการแก้ไขถูกบันทึกในแท็บ `Log`
