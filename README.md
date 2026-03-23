# ⛽ KPS Fuel Good

**แพลตฟอร์มบริหารจัดการปั๊มน้ำมันในประเทศไทย**

พัฒนาโดย **คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์**

---

## 🎯 คุณสมบัติ

- 🗺️ **แผนที่แบบโต้ตอบ** – OpenStreetMap + Leaflet.js (ฟรี, ไม่ต้องใช้ API Key)
- 🔑 **เข้าสู่ระบบด้วย Google** – Firebase Authentication
- ⛽ **จัดการสต๊อกน้ำมัน** – แสดงผลเป็นเปอร์เซ็นต์สำหรับน้ำมันแต่ละชนิด
- 📱 **Responsive Design** – รองรับทุกขนาดหน้าจอ
- 🏪 **ลงทะเบียนปั๊ม** – ระบบลงทะเบียนแบบ step-by-step
- 📊 **แดชบอร์ด** – บริหารจัดการปั๊มน้ำมันของคุณ

## 🎨 โทนสี

| ชื่อ | CSS Variable | HEX |
|------|-------------|-----|
| แดงเลือดหมู | `--primary` | `#8B1A1A` |
| ทอง | `--gold` | `#C9A227` |
| พื้นหลังเข้ม | `--bg-dark` | `#1A0A0A` |

## 📁 โครงสร้างไฟล์

```
kps-fuel-good/
├── index.html          # หน้าหลัก + แผนที่
├── login.html          # เข้าสู่ระบบ (Google)
├── dashboard.html      # แดชบอร์ดเจ้าของปั๊ม
├── register.html       # ลงทะเบียนปั๊มน้ำมัน
├── station.html        # รายละเอียดปั๊ม
├── station-list.html   # รายการปั๊มทั้งหมด
├── css/
│   └── style.css       # Stylesheet หลัก
├── js/
│   ├── firebase-config.js  # ตั้งค่า Firebase (⚠️ แก้ไขก่อนใช้)
│   ├── auth.js             # ระบบ Authentication
│   ├── db.js               # Database Operations
│   ├── map.js              # Leaflet Map Module
│   └── app.js              # Utilities หลัก
├── firebase.json           # Firebase Hosting config
├── firestore.rules         # Security Rules
└── firestore.indexes.json  # Firestore Indexes
```

## 🚀 การติดตั้งและ Deploy

### ขั้นตอนที่ 1: สร้าง Firebase Project

1. ไปที่ https://console.firebase.google.com/
2. คลิ๊ก "Add project" → ตั้งชื่อ เช่น `kps-fuel-good`
3. เปิดใช้งาน **Authentication** → เลือก Google provider
4. สร้าง **Firestore Database** (เลือก `Start in test mode` ก่อน)
5. ไปที่ Project Settings → General → Web apps → `</>` → Register app
6. คัดลอก `firebaseConfig`

### ขั้นตอนที่ 2: แก้ไข firebase-config.js

เปิดไฟล์ `js/firebase-config.js` และแทนที่ค่าต่อไปนี้:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### ขั้นตอนที่ 3: Deploy ขึ้น Firebase Hosting

```bash
# ติดตั้ง Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# เริ่มต้น project
firebase init

# Deploy
firebase deploy
```

### ทางเลือกอื่น: Deploy บน Netlify (ง่ายกว่า)

1. ไปที่ https://netlify.com
2. ลาก folder `kps-fuel-good` ทั้งหมดวางใน Deploy zone
3. รอ 30 วินาที – เสร็จ! ได้ URL ทันที

## ⛽ ประเภทน้ำมันที่รองรับ

| ชื่อ | Key |
|------|-----|
| แก๊สโซฮอล์ 91 | `gasohol91` |
| แก๊สโซฮอล์ 95 | `gasohol95` |
| แก๊สโซฮอล์ E20 | `e20` |
| แก๊สโซฮอล์ E85 | `e85` |
| ดีเซล B7 | `dieselB7` |
| ดีเซล B20 | `dieselB20` |
| ดีเซลพรีเมียม | `premiumDiesel` |
| NGV | `ngv` |

## 🗄️ โครงสร้างฐานข้อมูล (Firestore)

```
users/{uid}
  - uid, email, displayName, photoURL
  - role: 'owner' | 'admin' | 'viewer'
  - createdAt, updatedAt

stations/{stationId}
  - ownerId, name, brand, description
  - location: { lat, lng, address, subdistrict, district, province, postalCode }
  - contact: { phone, email, lineId, facebook, website }
  - fuelStock: { gasohol91, gasohol95, e20, e85, dieselB7, dieselB20, premiumDiesel, ngv }
  - openHours: { open, close }
  - isVerified, isActive
  - createdAt, updatedAt

fuelUpdates/{updateId}  ← audit log
  - stationId, updatedBy
  - previousStock, newStock
  - updatedAt
```

## 🔒 Security Rules

ไฟล์ `firestore.rules` กำหนดไว้ว่า:
- **stations**: อ่านได้ทุกคน (public read), สร้างได้เมื่อล็อกอิน, แก้ไข/ลบได้เฉพาะเจ้าของ

## 📞 ติดต่อ

คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์
https://eng.kps.ku.ac.th
