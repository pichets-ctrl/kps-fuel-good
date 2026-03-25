/**
 * KPS Fuel Good - Firebase Configuration
 * =====================================================
 * วิธีตั้งค่า Firebase:
 * 1. ไปที่ https://console.firebase.google.com/
 * 2. สร้างโปรเจกต์ใหม่ (ตั้งชื่อ kps-fuel-good หรืออื่นๆ)
 * 3. ไปที่ Project Settings > General > Your apps > Web app
 * 4. คัดลอกค่า firebaseConfig มาแทนที่ด้านล่าง
 * 5. เปิดใช้งาน Authentication > Google provider
 * 6. เปิดใช้งาน Firestore Database (Start in test mode เริ่มต้น)
 * 7. เปิดใช้งาน Hosting (ถ้าจะ deploy ผ่าน Firebase)
 * =====================================================
 */

const firebaseConfig = {
  apiKey:            "AIzaSyBQvoHdoex0c_v1OaUWcsyx6mZkrLsK0VI",
  authDomain:        "kps-fuel-good.firebaseapp.com",
  projectId:         "kps-fuel-good",
  storageBucket:     "kps-fuel-good.firebasestorage.app",
  messagingSenderId: "162119067632",
  appId:             "1:162119067632:web:63012116bddc75dfc69f35",
  measurementId:     "G-N17DSQN556"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence: not supported in this browser');
    }
  });

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Firestore Database Schema (scaleable)
 * =====================================================
 * Collection: users
 *   - uid: string
 *   - email: string
 *   - displayName: string
 *   - photoURL: string
 *   - role: 'owner' | 'admin' | 'viewer'
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *
 * Collection: stations
 *   - id: string (auto)
 *   - ownerId: string (ref to users.uid)
 *   - name: string
 *   - brand: string (PTT, Shell, Caltex, Esso, Susco, ไม่สังกัด ฯลฯ)
 *   - description: string
 *   - location: {
 *       lat: number, lng: number,
 *       address: string, subdistrict: string,
 *       district: string, province: string, postalCode: string
 *     }
 *   - contact: {
 *       phone: string, email: string,
 *       website: string, lineId: string, facebook: string
 *     }
 *   - fuelStock: {
 *       gasohol91: number (0-100),
 *       gasohol95: number (0-100),
 *       e20: number (0-100),
 *       e85: number (0-100),
 *       dieselB7: number (0-100),
 *       dieselB20: number (0-100),
 *       premiumDiesel: number (0-100),
 *       ngv: number (0-100)
 *     }
 *   - openHours: { open: string, close: string, openDays: string[] }
 *   - images: string[] (Storage URLs)
 *   - isVerified: boolean
 *   - isActive: boolean
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *
 * Collection: fuelUpdates (audit log)
 *   - stationId: string
 *   - updatedBy: string
 *   - previousStock: object
 *   - newStock: object
 *   - updatedAt: Timestamp
 *
 * Firestore Security Rules (firestore.rules):
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{uid} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth.uid == uid;
 *     }
 *     match /stations/{stationId} {
 *       allow read: if true;  // public read
 *       allow create: if request.auth != null;
 *       allow update, delete: if request.auth != null &&
 *         (request.auth.uid == resource.data.ownerId ||
 *          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
 *     }
 *     match /fuelUpdates/{updateId} {
 *       allow read: if request.auth != null;
 *       allow create: if request.auth != null;
 *     }
 *   }
 * }
 * =====================================================
 */
