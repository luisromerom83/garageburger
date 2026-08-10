// Admin Dashboard CMS Logic for GarageBurger

let adminMenu = [];
let adminConfig = {};

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const pinInput = document.getElementById('pin-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

const statusBtns = document.querySelectorAll('.status-btn');
const cfgWa = document.getElementById('cfg-wa');
const cfgAnnouncement = document.getElementById('cfg-announcement');
const saveConfigBtn = document.getElementById('save-config-btn');

const adminMenuRows = document.getElementById('admin-menu-rows');
const addItemBtn = document.getElementById('add-item-btn');

const configJsonView = document.getElementById('config-json-view');
const menuJsonView = document.getElementById('menu-json-view');
const copyCfgBtn = document.getElementById('copy-cfg-btn');
const copyMenuBtn = document.getElementById('copy-menu-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const resetDraftBtn = document.getElementById('reset-draft-btn');

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadAdminData();
  setupAdminListeners();
});

// Authentication
function checkAuthStatus() {
  const isAuth = sessionStorage.getItem('gb_admin_auth');
  if (isAuth === 'true') {
    loginOverlay.style.display = 'none';
  } else {
    loginOverlay.style.display = 'flex';
  }
}

function setupAdminListeners() {
  loginBtn.addEventListener('click', () => {
    const pin = pinInput.value.trim();
    if (pin === '1234' || (adminConfig.adminPin && pin === adminConfig.adminPin)) {
      sessionStorage.setItem('gb_admin_auth', 'true');
      loginOverlay.style.display = 'none';
    } else {
      alert('PIN Incorrecto');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('gb_admin_auth');
    loginOverlay.style.display = 'flex';
  });

  // Status toggle
  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => b.className = 'status-btn');
      const st = btn.getAttribute('data-status');
      btn.className = `status-btn active ${st}`;
      adminConfig.statusOverride = st;
      updateJsonPreviews();
    });
  });

  // Save config
  saveConfigBtn.addEventListener('click', () => {
    adminConfig.whatsappPhone = cfgWa.value.trim();
    adminConfig.announcementText = cfgAnnouncement.value.trim();
    saveLocalState();
    alert('¡Ajustes de tienda guardados en borrador!');
  });

  // Add Item
  addItemBtn.addEventListener('click', () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: 'Nuevo Platillo',
      category: 'hamburguesas',
      price: 100,
      description: 'Descripción del platillo...',
      image: 'assets/Screenshot_20260810_105331.png',
      badge: '',
      available: true
    };
    adminMenu.push(newItem);
    renderAdminTable();
    saveLocalState();
  });

  // Export JSON
  exportJsonBtn.addEventListener('click', downloadJsonFiles);
  resetDraftBtn.addEventListener('click', resetDraftState);

  // Copy buttons
  copyCfgBtn.addEventListener('click', () => copyToClipboard(JSON.stringify(adminConfig, null, 2), 'config.json'));
  copyMenuBtn.addEventListener('click', () => copyToClipboard(JSON.stringify(adminMenu, null, 2), 'menu.json'));
}

async function loadAdminData() {
  // Load Config
  const localCfg = localStorage.getItem('gb_config_draft');
  if (localCfg) {
    adminConfig = JSON.parse(localCfg);
  } else {
    const res = await fetch('data/config.json');
    adminConfig = await res.json();
  }

  // Load Menu
  const localMenu = localStorage.getItem('gb_menu_draft');
  if (localMenu) {
    adminMenu = JSON.parse(localMenu);
  } else {
    const res = await fetch('data/menu.json');
    adminMenu = await res.json();
  }

  populateConfigForm();
  renderAdminTable();
  updateJsonPreviews();
}

function populateConfigForm() {
  cfgWa.value = adminConfig.whatsappPhone || '522871270483';
  cfgAnnouncement.value = adminConfig.announcementText || '';

  const st = adminConfig.statusOverride || 'auto';
  statusBtns.forEach(btn => {
    if (btn.getAttribute('data-status') === st) {
      btn.className = `status-btn active ${st}`;
    } else {
      btn.className = 'status-btn';
    }
  });
}

function renderAdminTable() {
  adminMenuRows.innerHTML = adminMenu.map((item, index) => `
    <tr>
      <td>
        <input type="text" class="form-control" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)">
      </td>
      <td>
        <select class="form-control" onchange="updateItem(${index}, 'category', this.value)">
          <option value="hamburguesas" ${item.category === 'hamburguesas' ? 'selected' : ''}>Hamburguesas</option>
          <option value="boneless" ${item.category === 'boneless' ? 'selected' : ''}>Boneless & Snacks</option>
          <option value="bebidas" ${item.category === 'bebidas' ? 'selected' : ''}>Cervezas & Bebidas</option>
          <option value="salsas" ${item.category === 'salsas' ? 'selected' : ''}>Salsas</option>
          <option value="extras" ${item.category === 'extras' ? 'selected' : ''}>Extras</option>
        </select>
      </td>
      <td>
        <input type="number" class="form-control" value="${item.price}" style="width: 90px;" onchange="updateItem(${index}, 'price', parseFloat(this.value))">
      </td>
      <td>
        <input type="text" class="form-control" value="${item.badge || ''}" placeholder="Ej: Top" onchange="updateItem(${index}, 'badge', this.value)">
      </td>
      <td>
        <span class="badge-toggle ${item.available ? 'in-stock' : 'out-stock'}" onclick="toggleAvailability(${index})">
          ${item.available ? 'Disponible' : 'Agotado'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" style="color: var(--accent-red);" onclick="deleteItem(${index})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.updateItem = function(index, field, value) {
  adminMenu[index][field] = value;
  saveLocalState();
};

window.toggleAvailability = function(index) {
  adminMenu[index].available = !adminMenu[index].available;
  renderAdminTable();
  saveLocalState();
};

window.deleteItem = function(index) {
  if (confirm(`¿Eliminar ${adminMenu[index].name}?`)) {
    adminMenu.splice(index, 1);
    renderAdminTable();
    saveLocalState();
  }
};

function saveLocalState() {
  localStorage.setItem('gb_config_draft', JSON.stringify(adminConfig));
  localStorage.setItem('gb_menu_draft', JSON.stringify(adminMenu));
  updateJsonPreviews();
}

function updateJsonPreviews() {
  configJsonView.textContent = JSON.stringify(adminConfig, null, 2);
  menuJsonView.textContent = JSON.stringify(adminMenu, null, 2);
}

function downloadJsonFiles() {
  downloadBlob(JSON.stringify(adminConfig, null, 2), 'config.json', 'application/json');
  setTimeout(() => {
    downloadBlob(JSON.stringify(adminMenu, null, 2), 'menu.json', 'application/json');
  }, 500);
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text, name) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`¡${name} copiado al portapapeles!`);
  });
}

function resetDraftState() {
  if (confirm('¿Restablecer el borrador a los valores JSON originales?')) {
    localStorage.removeItem('gb_config_draft');
    localStorage.removeItem('gb_menu_draft');
    loadAdminData();
  }
}
