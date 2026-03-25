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

  /* ---- Queue Status Metadata ---- */
  const QUEUE_STATUSES = {
    pending:   { label: 'รอคิว',            icon: '⏳', color: '#FF9800', badgeClass: 'badge-warning'  },
    called:    { label: 'เรียกคิวแล้ว',     icon: '📢', color: '#2196F3', badgeClass: 'badge-info'     },
    serving:   { label: 'กำลังให้บริการ',   icon: '⛽', color: '#9C27B0', badgeClass: 'badge-serving'  },
    completed: { label: 'เสร็จสิ้น',        icon: '✅', color: '#4CAF50', badgeClass: 'badge-success'  },
    cancelled: { label: 'ยกเลิก',           icon: '❌', color: '#9E9E9E', badgeClass: 'badge-cancelled' }
  };

  /* ---- Daily limit per customer ---- */
  const DAILY_QUEUE_LIMIT = 3;

  /* ---- Get today's date string (Thai timezone) ---- */
  function getTodayStr() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD
  }

  /* =========================================
     USER / ROLE
     ========================================= */

  async function getUserRole(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (!doc.exists) return null;
      return doc.data().role || null;
    } catch { return null; }
  }

  async function setUserRole(uid, role) {
    try {
      await db.collection('users').doc(uid).set({ role, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  /* =========================================
     STATIONS
     ========================================= */
  async function getStations(filters = {}) {
    try {
      // ดึงทุก document แล้ว filter client-side (รองรับ doc ที่ไม่มี isActive field)
      const snap = await db.collection('stations').get();
      let stations = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.isActive !== false); // แสดงเมื่อ isActive=true หรือไม่มี field นี้
      if (filters.province) stations = stations.filter(s => s.location?.province === filters.province);
      if (filters.brand)    stations = stations.filter(s => s.brand === filters.brand);
      stations.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      return stations;
    } catch (e) {
      console.error('getStations error:', e);
      throw e;
    }
  }

  async function getStation(id) {
    try {
      const doc = await db.collection('stations').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (e) { return null; }
  }

  async function getMyStations(uid) {
    try {
      const snap = await db.collection('stations')
        .where('ownerId', '==', uid).get();
      const stations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      stations.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      return stations;
    } catch (e) { console.error('getMyStations error:', e); return []; }
  }

  async function createStation(data, uid) {
    try {
      const ref = await db.collection('stations').add({
        ...data, ownerId: uid, isVerified: false, isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, id: ref.id };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function updateStation(id, data, uid) {
    try {
      const doc = await db.collection('stations').doc(id).get();
      if (!doc.exists) return { success: false, error: 'ไม่พบปั๊มน้ำมัน' };
      if (doc.data().ownerId !== uid) return { success: false, error: 'ไม่มีสิทธิ์แก้ไข' };
      await db.collection('stations').doc(id).update({
        ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function updateFuelStock(stationId, newStock, uid) {
    try {
      const doc = await db.collection('stations').doc(stationId).get();
      if (!doc.exists) return { success: false, error: 'ไม่พบปั๊มน้ำมัน' };
      const prev = doc.data().fuelStock || {};
      const batch = db.batch();
      batch.update(db.collection('stations').doc(stationId), {
        fuelStock: newStock,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      batch.set(db.collection('fuelUpdates').doc(), {
        stationId, updatedBy: uid, previousStock: prev, newStock,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await batch.commit();
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function deleteStation(id, uid) {
    try {
      await db.collection('stations').doc(id).update({
        isActive: false, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function getStats() {
    try {
      const snap = await db.collection('stations').where('isActive', '==', true).get();
      const stations = snap.docs.map(d => d.data());
      return {
        total:    stations.length,
        verified: stations.filter(s => s.isVerified).length,
        provinces:[...new Set(stations.map(s => s.location?.province).filter(Boolean))].length
      };
    } catch { return { total: 0, verified: 0, provinces: 0 }; }
  }

  /* =========================================
     QUEUES
     ========================================= */

  /**
   * สร้างคิวใหม่
   * Schema: queues/{queueId}
   *  - customerId, customerName, customerPhone
   *  - stationId, stationName, stationBrand
   *  - fuelType (key), fuelLabel
   *  - queueNumber (daily per station, 1-based)
   *  - date (YYYY-MM-DD, Asia/Bangkok)
   *  - status: pending | called | serving | completed | cancelled
   *  - note
   *  - createdAt, updatedAt, servedAt
   */
  async function createQueue({ customerId, customerName, stationId, stationName, stationBrand, fuelType, note }) {
    const today = getTodayStr();

    // ดึงคิวของลูกค้าวันนี้ทั้งหมด (query เดียว ไม่ต้องใช้ composite index ซับซ้อน)
    const myTodaySnap = await db.collection('queues')
      .where('customerId', '==', customerId)
      .where('date', '==', today)
      .get();
    const myToday = myTodaySnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 1. ตรวจสอบ limit รายวัน (max 3)
    const activeCount = myToday.filter(q => ['pending','called','serving','completed'].includes(q.status)).length;
    if (activeCount >= DAILY_QUEUE_LIMIT) {
      return { success: false, error: `คุณจองคิวครบ ${DAILY_QUEUE_LIMIT} ปั๊มแล้วในวันนี้ (รีเซ็ตพรุ่งนี้)` };
    }

    // 2. ตรวจสอบจองปั๊มซ้ำ
    const dup = myToday.find(q => q.stationId === stationId && ['pending','called','serving'].includes(q.status));
    if (dup) {
      return { success: false, error: 'คุณมีคิวที่ปั๊มนี้อยู่แล้วในวันนี้' };
    }

    // 3. คำนวณหมายเลขคิว (ดึงคิวปั๊มนี้วันนี้ แล้วหา max)
    const stationTodaySnap = await db.collection('queues')
      .where('stationId', '==', stationId)
      .where('date', '==', today)
      .get();
    const stationQueues = stationTodaySnap.docs.map(d => d.data().queueNumber || 0);
    const queueNumber = stationQueues.length ? Math.max(...stationQueues) + 1 : 1;

    const fuel = FUEL_TYPES.find(f => f.key === fuelType);

    const ref = await db.collection('queues').add({
      customerId,
      customerName,
      stationId,
      stationName,
      stationBrand: stationBrand || '',
      fuelType,
      fuelLabel: fuel?.label || fuelType,
      fuelColor: fuel?.color || '#C9A227',
      queueNumber,
      date: today,
      status: 'pending',
      note:  note || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      servedAt: null
    });

    return { success: true, id: ref.id, queueNumber };
  }

  /** ดึงคิวทั้งหมดของลูกค้าวันนี้ */
  async function getMyQueues(customerId, dateStr = null) {
    try {
      const date = dateStr || getTodayStr();
      const snap = await db.collection('queues')
        .where('customerId', '==', customerId)
        .where('date', '==', date)
        .orderBy('createdAt', 'desc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
  }

  /** ดึงคิวทั้งหมดของลูกค้า (ทุกวัน, pagination) */
  async function getMyAllQueues(customerId, limit = 20) {
    try {
      const snap = await db.collection('queues')
        .where('customerId', '==', customerId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
  }

  /** ดึงคิวทั้งหมดของปั๊มวันนี้ (สำหรับ operator) */
  async function getStationQueues(stationId, dateStr = null) {
    try {
      const date = dateStr || getTodayStr();
      const snap = await db.collection('queues')
        .where('stationId', '==', stationId)
        .where('date', '==', date)
        .orderBy('queueNumber', 'asc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { return []; }
  }

  /** ดึงสรุปสถิติคิวของปั๊มวันนี้ */
  async function getStationQueueStats(stationId, dateStr = null) {
    const queues = await getStationQueues(stationId, dateStr);
    return {
      total:     queues.length,
      pending:   queues.filter(q => q.status === 'pending').length,
      called:    queues.filter(q => q.status === 'called').length,
      serving:   queues.filter(q => q.status === 'serving').length,
      completed: queues.filter(q => q.status === 'completed').length,
      cancelled: queues.filter(q => q.status === 'cancelled').length,
    };
  }

  /** อัปเดตสถานะคิว (operator เท่านั้น) */
  async function updateQueueStatus(queueId, status, operatorId) {
    try {
      const data = {
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (status === 'completed' || status === 'serving') {
        data.servedAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await db.collection('queues').doc(queueId).update(data);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  /** ลูกค้ายกเลิกคิวตัวเอง */
  async function cancelQueue(queueId, customerId) {
    try {
      const doc = await db.collection('queues').doc(queueId).get();
      if (!doc.exists) return { success: false, error: 'ไม่พบคิว' };
      if (doc.data().customerId !== customerId) return { success: false, error: 'ไม่มีสิทธิ์' };
      const status = doc.data().status;
      if (status === 'completed') return { success: false, error: 'คิวเสร็จสิ้นแล้ว ไม่สามารถยกเลิกได้' };
      if (status === 'serving')   return { success: false, error: 'กำลังให้บริการอยู่ กรุณาติดต่อปั๊มโดยตรง' };
      await db.collection('queues').doc(queueId).update({
        status: 'cancelled',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  /** นับจำนวนคิวที่ใช้งานแล้ววันนี้ของลูกค้า */
  async function getMyTodayQueueCount(customerId) {
    try {
      const snap = await db.collection('queues')
        .where('customerId', '==', customerId)
        .where('date', '==', getTodayStr())
        .get();
      return snap.docs.filter(d => ['pending','called','serving','completed'].includes(d.data().status)).length;
    } catch { return 0; }
  }

  /** Real-time listener: คิวของปั๊มวันนี้ (ไม่ใช้ orderBy เพื่อหลีกเลี่ยง composite index) */
  function listenStationQueues(stationId, callback) {
    const today = getTodayStr();
    return db.collection('queues')
      .where('stationId', '==', stationId)
      .where('date', '==', today)
      .onSnapshot(snap => {
        const queues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        queues.sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
        callback(queues);
      });
  }

  /** Real-time listener: คิวของลูกค้าวันนี้ */
  function listenMyQueues(customerId, callback) {
    const today = getTodayStr();
    return db.collection('queues')
      .where('customerId', '==', customerId)
      .where('date', '==', today)
      .onSnapshot(snap => {
        const queues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        queues.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
        callback(queues);
      });
  }

  /* =========================================
     DEMO DATA
     ========================================= */
  function getDemoStations() {
    return [
      {
        id: 'demo-1', name: 'ปั๊ม PTT กำแพงแสน', brand: 'PTT',
        location: { lat: 14.0021, lng: 99.9624, address: '123 ถ.กำแพงแสน', district: 'กำแพงแสน', province: 'นครปฐม', postalCode: '73140' },
        contact: { phone: '034-351234', email: 'ptt.kps@example.com', lineId: '@pttkps' },
        fuelStock: { gasohol91: 85, gasohol95: 70, e20: 60, e85: 45, dieselB7: 90, dieselB20: 50, premiumDiesel: 75, ngv: 30 },
        openHours: { open: '06:00', close: '22:00' }, isActive: true, isVerified: true
      },
      {
        id: 'demo-2', name: 'ปั๊ม Shell มหาวิทยาลัย', brand: 'Shell',
        location: { lat: 14.0180, lng: 99.9710, address: '456 ถ.มหาวิทยาลัย', district: 'กำแพงแสน', province: 'นครปฐม', postalCode: '73140' },
        contact: { phone: '034-352345', email: 'shell.mku@example.com' },
        fuelStock: { gasohol91: 20, gasohol95: 55, e20: 80, e85: 0, dieselB7: 65, dieselB20: 40, premiumDiesel: 90, ngv: 0 },
        openHours: { open: '00:00', close: '24:00' }, isActive: true, isVerified: true
      },
      {
        id: 'demo-3', name: 'ปั๊ม BangChak ดอนยายหอม', brand: 'BangChak',
        location: { lat: 13.9850, lng: 99.9500, address: '789 ถ.ดอนยายหอม', district: 'นครชัยศรี', province: 'นครปฐม', postalCode: '73120' },
        contact: { phone: '034-353456', facebook: 'bangchak.donyayhom' },
        fuelStock: { gasohol91: 50, gasohol95: 45, e20: 35, e85: 25, dieselB7: 75, dieselB20: 60, premiumDiesel: 55, ngv: 0 },
        openHours: { open: '06:00', close: '22:00' }, isActive: true, isVerified: false
      },
      {
        id: 'demo-4', name: 'ปั๊ม Caltex นครปฐม', brand: 'Caltex',
        location: { lat: 13.8196, lng: 100.0641, address: '321 ถ.เพชรเกษม', district: 'เมือง', province: 'นครปฐม', postalCode: '73000' },
        contact: { phone: '034-354567', website: 'https://caltex.example.com' },
        fuelStock: { gasohol91: 95, gasohol95: 88, e20: 72, e85: 60, dieselB7: 82, dieselB20: 70, premiumDiesel: 65, ngv: 55 },
        openHours: { open: '05:00', close: '23:00' }, isActive: true, isVerified: true
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

  function getQueueStatusInfo(status) {
    return QUEUE_STATUSES[status] || QUEUE_STATUSES.pending;
  }

  return {
    FUEL_TYPES, BRANDS, PROVINCES, QUEUE_STATUSES, DAILY_QUEUE_LIMIT,
    getTodayStr, getUserRole, setUserRole,
    getStations, getStation, getMyStations,
    createStation, updateStation, updateFuelStock, deleteStation, getStats,
    createQueue, getMyQueues, getMyAllQueues,
    getStationQueues, getStationQueueStats,
    updateQueueStatus, cancelQueue, getMyTodayQueueCount,
    listenStationQueues, listenMyQueues,
    getDemoStations, getFuelPercent, renderFuelBadge, getQueueStatusInfo
  };
})();
