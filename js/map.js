/**
 * KPS Fuel Good - Map Module (Leaflet.js + OpenStreetMap)
 * Free, no API key required
 */

const MapModule = (() => {
  let mapInstance = null;
  let markersLayer = null;
  let stationMarkers = {};

  // Custom marker icon (SVG fuel pump)
  function createMarkerIcon(color = '#C9A227', verified = false) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/>
        </filter>
        <path d="M16 0C7.16 0 0 7.16 0 16c0 11.84 16 24 16 24s16-12.16 16-24C32 7.16 24.84 0 16 0z"
              fill="${color}" filter="url(#shadow)"/>
        <circle cx="16" cy="16" r="10" fill="rgba(0,0,0,0.25)"/>
        <text x="16" y="21" text-anchor="middle" font-size="12" font-weight="bold"
              font-family="sans-serif" fill="white">⛽</text>
        ${verified ? '<circle cx="26" cy="6" r="5" fill="#4CAF50"/><text x="26" y="9.5" text-anchor="middle" font-size="8" fill="white">✓</text>' : ''}
      </svg>`;
    return L.divIcon({
      html: svg,
      className: '',
      iconSize:   [32, 40],
      iconAnchor: [16, 40],
      popupAnchor:[0, -42]
    });
  }

  // Brand color mapping
  const brandColors = {
    PTT:       '#4CAF50',
    Shell:     '#FFD700',
    Caltex:    '#FF5722',
    Esso:      '#1565C0',
    Susco:     '#E91E63',
    BangChak:  '#FF9800',
    IRPC:      '#9C27B0',
    default:   '#C9A227'
  };

  function getBrandColor(brand) {
    return brandColors[brand] || brandColors.default;
  }

  /* ---- Build popup HTML ---- */
  function buildPopupHTML(station) {
    const fuels = (DB.FUEL_TYPES || [])
      .filter(f => station.fuelStock && station.fuelStock[f.key] > 0)
      .slice(0, 6);

    const fuelRows = fuels.map(f => {
      const val = station.fuelStock[f.key];
      const cls = DB.getFuelPercent(val);
      return `
        <div class="popup-fuel">
          <span class="dot" style="background:${f.color}"></span>
          <span style="color:var(--text-muted)">${f.shortLabel}</span>
          <span class="fuel-${cls}" style="margin-left:auto;font-weight:700">${val}%</span>
        </div>`;
    }).join('');

    return `
      <div class="popup-content">
        <div class="popup-title">${station.name}</div>
        <div class="popup-brand">
          🏷️ ${station.brand || 'ไม่สังกัดแบรนด์'}
          ${station.isVerified ? ' &nbsp;<span style="color:#4CAF50;font-size:0.7rem">✓ ยืนยันแล้ว</span>' : ''}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem">
          📍 ${station.location?.district || ''}, ${station.location?.province || ''}
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.75rem">
          📞 ${station.contact?.phone || 'ไม่ระบุ'}
        </div>
        <div class="popup-fuels">${fuelRows || '<span style="color:var(--text-muted);font-size:0.75rem">ยังไม่มีข้อมูลสต๊อก</span>'}</div>
        <a href="station.html?id=${station.id}" class="popup-detail-link">
          ดูรายละเอียด →
        </a>
      </div>`;
  }

  /* ---- Initialize Map ---- */
  function init(containerId = 'map', options = {}) {
    const defaultCenter = options.center || [13.7563, 100.5018]; // Bangkok
    const defaultZoom   = options.zoom   || 7;

    mapInstance = L.map(containerId, {
      center: defaultCenter,
      zoom:   defaultZoom,
      zoomControl: false
    });

    // OpenStreetMap tile layer (completely free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance);

    // Custom zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    // Markers layer group
    markersLayer = L.layerGroup().addTo(mapInstance);

    return mapInstance;
  }

  /* ---- Add Stations to Map ---- */
  function addStations(stations) {
    clearMarkers();
    stations.forEach(station => addStation(station));
  }

  function addStation(station) {
    if (!station.location?.lat || !station.location?.lng) return;

    const color  = getBrandColor(station.brand);
    const icon   = createMarkerIcon(color, station.isVerified);
    const marker = L.marker([station.location.lat, station.location.lng], { icon })
      .bindPopup(buildPopupHTML(station), {
        maxWidth: 300,
        className: 'kps-popup'
      });

    marker.addTo(markersLayer);
    stationMarkers[station.id] = marker;
    return marker;
  }

  function clearMarkers() {
    markersLayer.clearLayers();
    stationMarkers = {};
  }

  function focusStation(stationId) {
    const marker = stationMarkers[stationId];
    if (marker) {
      mapInstance.flyTo(marker.getLatLng(), 15, { duration: 1.2 });
      marker.openPopup();
    }
  }

  function locateUser() {
    return new Promise((resolve, reject) => {
      mapInstance.locate({ setView: true, maxZoom: 14 });
      mapInstance.once('locationfound', e => resolve(e.latlng));
      mapInstance.once('locationerror', e => reject(e));
    });
  }

  /* ---- Location Picker (for registration) ---- */
  function initPicker(containerId, onPick) {
    const pickerMap = L.map(containerId, {
      center: [13.7563, 100.5018],
      zoom: 10
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(pickerMap);

    let pickerMarker = null;

    pickerMap.on('click', async e => {
      const { lat, lng } = e.latlng;

      if (pickerMarker) {
        pickerMarker.setLatLng(e.latlng);
      } else {
        pickerMarker = L.marker(e.latlng, {
          icon: createMarkerIcon('#C9A227', false),
          draggable: true
        }).addTo(pickerMap);

        pickerMarker.on('dragend', async ev => {
          const p = ev.target.getLatLng();
          const addr = await reverseGeocode(p.lat, p.lng);
          if (onPick) onPick({ lat: p.lat, lng: p.lng, ...addr });
        });
      }

      const addr = await reverseGeocode(lat, lng);
      if (onPick) onPick({ lat, lng, ...addr });
    });

    return pickerMap;
  }

  /* ---- Reverse Geocode (Nominatim - free) ---- */
  async function reverseGeocode(lat, lng) {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`,
        { headers: { 'Accept-Language': 'th' } }
      );
      const data = await resp.json();
      const a = data.address || {};
      return {
        address:     data.display_name || '',
        subdistrict: a.suburb || a.village || a.quarter || '',
        district:    a.city_district || a.county || a.district || '',
        province:    a.state || a.city || '',
        postalCode:  a.postcode || ''
      };
    } catch {
      return { address: '', subdistrict: '', district: '', province: '', postalCode: '' };
    }
  }

  /* ---- Forward Geocode (search) ---- */
  async function searchLocation(query) {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Thailand')}&format=json&limit=5&accept-language=th`
      );
      return await resp.json();
    } catch {
      return [];
    }
  }

  function flyTo(lat, lng, zoom = 15) {
    if (mapInstance) mapInstance.flyTo([lat, lng], zoom, { duration: 1 });
  }

  function getMap() { return mapInstance; }

  return {
    init, addStations, addStation, clearMarkers,
    focusStation, locateUser, initPicker,
    reverseGeocode, searchLocation, flyTo, getMap,
    getBrandColor
  };
})();
