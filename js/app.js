/**
 * KPS Fuel Good - Main App Utilities
 */

/* ---- Toast notifications ---- */
const Toast = (() => {
  function show(msg, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toast-container') || createContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 320);
    }, duration);
  }

  function createContainer() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
    return el;
  }

  return { show };
})();

/* ---- Loading overlay ---- */
const Loader = (() => {
  let overlay = null;

  function show(msg = 'กำลังโหลด...') {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `<div class="spinner"></div><p>${msg}</p>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector('p').textContent = msg;
    overlay.classList.add('active');
  }

  function hide() {
    if (overlay) overlay.classList.remove('active');
  }

  return { show, hide };
})();

/* ---- Hamburger menu ---- */
function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const menu  = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
    const spans = btn.querySelectorAll('span');
    if (menu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

/* ---- Logout buttons ---- */
function initLogoutButtons() {
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      const r = await Auth.signOut();
      if (r.success) {
        Toast.show('ออกจากระบบเรียบร้อย', 'success');
        setTimeout(() => window.location.href = 'index.html', 800);
      }
    });
  });
}

/* ---- Range input live display ---- */
function initRangeInputs() {
  document.querySelectorAll('input[type="range"]').forEach(input => {
    const valEl = document.getElementById(input.id + '-val');
    if (valEl) {
      input.addEventListener('input', () => {
        valEl.textContent = input.value + '%';
        // Change color based on value
        const v = parseInt(input.value);
        if      (v === 0)  valEl.className = 'range-val fuel-empty';
        else if (v <= 25)  valEl.className = 'range-val fuel-low';
        else if (v <= 50)  valEl.className = 'range-val fuel-medium';
        else               valEl.className = 'range-val fuel-high';
      });
    }
  });
}

/* ---- Fuel stock display renderer ---- */
function renderFuelGrid(containerId, fuelStock) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = DB.FUEL_TYPES.map(fuel => {
    const val = fuelStock?.[fuel.key] ?? -1;
    if (val < 0) return '';
    const cls  = DB.getFuelPercent(val);
    const pct  = val === 0 ? 0 : val;

    return `
      <div class="fuel-item">
        <div class="fuel-name">${fuel.label}</div>
        <div class="fuel-percent fuel-${cls}">${val > 0 ? val + '%' : '<span style="color:#9E9E9E">ไม่มี</span>'}</div>
        <div class="fuel-bar">
          <div class="fuel-bar-fill" style="width:${pct}%;background:${fuel.color}"></div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = html || '<p class="text-muted">ยังไม่มีข้อมูลสต๊อกเชื้อเพลิง</p>';
}

/* ---- Confirm dialog ---- */
function confirmDialog(title, message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-muted)">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="confirm-cancel">ยกเลิก</button>
          <button class="btn btn-danger"  id="confirm-ok">ยืนยัน</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('confirm-ok').onclick = () => {
      overlay.remove(); resolve(true);
    };
    document.getElementById('confirm-cancel').onclick = () => {
      overlay.remove(); resolve(false);
    };
  });
}

/* ---- URL params helper ---- */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---- Format date ---- */
function formatDate(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ---- On DOM ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initLogoutButtons();
  initRangeInputs();
});
