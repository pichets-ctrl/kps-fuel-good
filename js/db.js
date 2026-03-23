/**
 * KPS Fuel Good - Database Operations
 */

const DB = (() => {

  /* ---- Fuel Type Metadata ---- */
  const FUEL_TYPES = [
    { key: 'gasohol91',    label: 'แก๊สโซฮอล์ 91', shortLabel: 'E10-91', color: '#4CAF50',  dot: '#4CAF50'  },
    { key: 'gasohol95',    label: 'แก๊สโซฮอล์ 95', shortLabel: 'E10-95', color: '#8BC34A',  dot: '#8BC34A'  },
    { key: 'e20',          label: 'แก๊สโซฮอล์ E20', shortLabel: 'E20',   color: '#03A9F4',  dot: '#03A9F4'  },
    { key: 'e85',          label: 'แก๊สโซฮอล์ E85', shortLabel: 'E85',   color: '#9C27B0',  dot: '#9C27B0'  },
    { key: 'dieselB7',     label: 'ดีเซล B7',        shortLabel: 'B7',    color: '#FF9800',  dot: '#FF9800'  },
    { key: 'dieselB20',    label: 'ดีเซล B20',       shortLabel: 'B20',   color: '#FF5722',  dot: '#FF5722'  },
    { key: 'premiumDiesel',label: 'ดีเซลพรีเมียม',   shortLabel: 'Hi-D',  color: '#C9A227',  dot: '#C9A227'  },
    { key: 'ngv',          label: 'NGV',              shortLabel: 'NGV',   color: '#607D8B',  dot: '#607D8B'  }
  ];

  const BRANDS = [
    'PTT', 'Shell', 'Caltex', 'Esso', 'Susco', 'BangChak',
    'IRPC', 'Petroleum', 'Jet', 'Chana Oil', 'ไม่สังกัดแบรนด์'
  ];

  const PROVINCES = [
    'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น',
    'จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย',
    'เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา',
    'นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์',
    'ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พะเยา',
    'พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต',
    'มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง',
    'ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร',
    'สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี',
    'สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย',
    'หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี',
    'อุบลราชธานี','นครพนม'
  ];

  /* ---- Stations ---- */
  async function getStations(filters = {}) {
    try {
      let query = db.collection('stations').where('isActive', '==', true);

      if (filters.province) {
        query = query.where('location.province', '==', filters.province);
      }
      if (filters.brand) {
        query = query.where('brand', '==', filters.brand);
      }

      const snap = await query.orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('getStations error:', e);
      return [];
    }
  }

  async function getStation(id) {
    try {
      const doc = await db.collection('stations').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (e) {
      console.error('getStation error:', e);
      return null;
    }
  }

  async function getMyStations(uid) {
    try {
      const snap = await db.collection('stations')
        .where('ownerId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('getMyStations error:', e);
      return [];
    }
  }

  async function createStation(data, uid) {
    try {
      const stationData = {
        ...data,
        ownerId:   uid,
        isVerified: false,
        isActive:  true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const ref = await db.collection('stations').add(stationData);
      return { success: true, id: ref.id };
    } catch (e) {
      console.error('createStation error:', e);
      return { success: false, error: e.message };
    }
  }

  async function updateStation(id, data, uid) {
    try {
      const doc = await db.collection('stations').doc(id).get();
      if (!doc.exists) return { success: false, error: 'ไม่พบปั๊มน้ำมัน' };
      if (doc.data().ownerId !== uid) return { success: false, error: 'ไม่มีสิทธิ์แก้ไข' };

      await db.collection('stations').doc(id).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function updateFuelStock(stationId, newStock, uid) {
    try {
      const doc = await db.collection('stations').doc(stationId).get();
      if (!doc.exists) return { success: false, error: 'ไม่พบปั๊มน้ำมัน' };

      const prev = doc.data().fuelStock || {};

      const batch = db.batch();

      // Update station
      batch.update(db.collection('stations').doc(stationId), {
        fuelStock: newStock,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Write audit log
      batch.set(db.collection('fuelUpdates').doc(), {
        stationId,
        updatedBy:     uid,
        previousStock: prev,
        newStock,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function deleteStation(id, uid) {
    try {
      await db.collection('stations').doc(id).update({
        isActive:  false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /* ---- Stats ---- */
  async function getStats() {
    try {
      const snap = await db.collection('stations').where('isActive', '==', true).get();
      const stations = snap.docs.map(d => d.data());
      return {
        total:    stations.length,
        verified: stations.filter(s => s.isVerified).length,
        provinces: [...new Set(stations.map(s => s.location?.province).filter(Boolean))].length
      };
    } catch (e) {
      return { total: 0, verified: 0, provinces: 0 };
    }
  }

  /* ---- Demo Data (ใช้ระหว่างพัฒนา ก่อนมีข้อมูลจริง) ---- */
  function getDemoStations() {
    return [
      {
        id: 'demo-1',
        name: 'ปั๊ม PTT กำแพงแสน',
        brand: 'PTT',
        location: {
          lat: 14.0021, lng: 99.9624,
          address: '123 ถ.กำแพงแสน', district: 'กำแพงแสน',
          province: 'นครปฐม', postalCode: '73140'
        },
        contact: { phone: '034-351234', email: 'ptt.kps@example.com', lineId: '@pttkps' },
        fuelStock: { gasohol91: 85, gasohol95: 70, e20: 60, e85: 45,
                     dieselB7: 90, dieselB20: 50, premiumDiesel: 75, ngv: 30 },
        isActive: true, isVerified: true
      },
      {
        id: 'demo-2',
        name: 'ปั๊ม Shell มหาวิทยาลัย',
        brand: 'Shell',
        location: {
          lat: 14.0180, lng: 99.9710,
          address: '456 ถ.มหาวิทยาลัย', district: 'กำแพงแสน',
          province: 'นครปฐม', postalCode: '73140'
        },
        contact: { phone: '034-352345', email: 'shell.mku@example.com' },
        fuelStock: { gasohol91: 20, gasohol95: 55, e20: 80, e85: 0,
                     dieselB7: 65, dieselB20: 40, premiumDiesel: 90, ngv: 0 },
        isActive: true, isVerified: true
      },
      {
        id: 'demo-3',
        name: 'ปั๊ม BangChak ดอนยายหอม',
        brand: 'BangChak',
        location: {
          lat: 13.9850, lng: 99.9500,
          address: '789 ถ.ดอนยายหอม', district: 'นครชัยศรี',
          province: 'นครปฐม', postalCode: '73120'
        },
        contact: { phone: '034-353456', facebook: 'bangchak.donyayhom' },
        fuelStock: { gasohol91: 50, gasohol95: 45, e20: 35, e85: 25,
                     dieselB7: 75, dieselB20: 60, premiumDiesel: 55, ngv: 0 },
        isActive: true, isVerified: false
      },
      {
        id: 'demo-4',
        name: 'ปั๊ม Caltex นครปฐม',
        brand: 'Caltex',
        location: {
          lat: 13.8196, lng: 100.0641,
          address: '321 ถ.เพชรเกษม', district: 'เมือง',
          province: 'นครปฐม', postalCode: '73000'
        },
        contact: { phone: '034-354567', website: 'https://caltex.example.com' },
        fuelStock: { gasohol91: 95, gasohol95: 88, e20: 72, e85: 60,
                     dieselB7: 82, dieselB20: 70, premiumDiesel: 65, ngv: 55 },
        isActive: true, isVerified: true
      }
    ];
  }

  /* ---- Helpers ---- */
  function getFuelPercent(value) {
    if (value === 0 || value === undefined) return 'empty';
    if (value <= 25)  return 'low';
    if (value <= 50)  return 'medium';
    return 'high';
  }

  function renderFuelBadge(key, value) {
    const fuel = FUEL_TYPES.find(f => f.key === key);
    if (!fuel || value === undefined) return '';
    const cls = getFuelPercent(value);
    return `<span class="mini-fuel-badge fuel-${cls}"
                  style="background:${fuel.color}22;color:${fuel.color};border:1px solid ${fuel.color}55">
              ${fuel.shortLabel} ${value}%
            </span>`;
  }

  return {
    FUEL_TYPES, BRANDS, PROVINCES,
    getStations, getStation, getMyStations,
    createStation, updateStation, updateFuelStock, deleteStation,
    getStats, getDemoStations,
    getFuelPercent, renderFuelBadge
  };
})();
