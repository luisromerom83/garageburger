// Admin Dashboard CMS Logic for GarageBurger

let adminMenu = [];
let adminConfig = {};

// Popular FontAwesome Icons List for Tag Selection
const POPULAR_ICONS = [
  { icon: 'fa-beer-mug-empty', label: '🍺 Cerveza' },
  { icon: 'fa-drumstick-bite', label: '🍗 Alitas / Boneless' },
  { icon: 'fa-burger', label: '🍔 Hamburguesa' },
  { icon: 'fa-award', label: '🏆 Premio / Calidad' },
  { icon: 'fa-fire-flame-curved', label: '🔥 Picante / Fuego' },
  { icon: 'fa-star', label: '⭐ Estrella' },
  { icon: 'fa-pepper-hot', label: '🌶️ Chile / Salsa' },
  { icon: 'fa-clock', label: '⏰ Horario' },
  { icon: 'fa-heart', label: '❤️ Favorito' },
  { icon: 'fa-utensils', label: '🍴 Comida' },
  { icon: 'fa-tag', label: '🏷️ Oferta' },
  { icon: 'fa-truck-fast', label: '🚚 Domicilio' }
];

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const pinInput = document.getElementById('pin-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const saveAllVercelBtn = document.getElementById('save-all-vercel-btn');

// Hero Inputs
const heroTitleInput = document.getElementById('hero-title-input');
const heroImageInput = document.getElementById('hero-image-input');
const heroDescInput = document.getElementById('hero-desc-input');
const heroBadgeLabelInput = document.getElementById('hero-badge-label-input');
const heroBadgeHighlightInput = document.getElementById('hero-badge-highlight-input');
const heroFeaturesEditor = document.getElementById('hero-features-editor');
const addFeatureTagBtn = document.getElementById('add-feature-tag-btn');

// Announcement Inputs
const announcementsEditorList = document.getElementById('announcements-editor-list');
const addAnnouncementBtn = document.getElementById('add-announcement-btn');

// Status & Categories Inputs
const statusBtns = document.querySelectorAll('.status-btn');
const cfgWa = document.getElementById('cfg-wa');
const categoriesEditorList = document.getElementById('categories-editor-list');
const addCategoryBtn = document.getElementById('add-category-btn');

// Product Table Inputs
const adminMenuRows = document.getElementById('admin-menu-rows');
const addItemBtn = document.getElementById('add-item-btn');

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadAdminData();
  setupAdminListeners();
});

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

  saveAllVercelBtn.addEventListener('click', saveAllToVercelStorage);

  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => b.className = 'status-btn');
      const st = btn.getAttribute('data-status');
      btn.className = `status-btn active ${st}`;
      adminConfig.statusOverride = st;
    });
  });

  addFeatureTagBtn.addEventListener('click', () => {
    if (!adminConfig.hero.features) adminConfig.hero.features = [];
    adminConfig.hero.features.push({ icon: 'fa-star', text: 'Nueva Etiqueta' });
    renderHeroFeatures();
  });

  addAnnouncementBtn.addEventListener('click', () => {
    if (!adminConfig.announcements) adminConfig.announcements = [];
    adminConfig.announcements.push({
      id: `ann-${Date.now()}`,
      title: 'NUEVO ANUNCIO',
      description: 'Descripción del anuncio...',
      image: 'assets/Screenshot_20260810_105000.png'
    });
    renderAnnouncementsEditor();
  });

  addCategoryBtn.addEventListener('click', () => {
    if (!adminConfig.categories) adminConfig.categories = [];
    const catName = prompt('Nombre de la nueva categoría (Ej: Postres):');
    if (catName) {
      const catId = catName.toLowerCase().replace(/[^a-z0-9]/g, '');
      adminConfig.categories.push({ id: catId, name: catName });
      renderCategoriesEditor();
    }
  });

  addItemBtn.addEventListener('click', () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: 'Nuevo Platillo',
      category: adminConfig.categories && adminConfig.categories.length > 0 ? adminConfig.categories[0].id : 'hamburguesas',
      price: 100,
      description: 'Descripción del platillo...',
      image: 'assets/Screenshot_20260810_105331.png',
      badge: '',
      available: true,
      isFavorite: false
    };
    adminMenu.push(newItem);
    renderAdminTable();
  });
}

async function loadAdminData() {
  try {
    const resApi = await fetch('/api/store');
    if (resApi.ok) {
      const dataApi = await resApi.json();
      if (dataApi.config && dataApi.menu) {
        adminConfig = dataApi.config;
        adminMenu = dataApi.menu;
        populateAllFields();
        return;
      }
    }

    const resCfg = await fetch('data/config.json');
    adminConfig = await resCfg.json();

    const resMenu = await fetch('data/menu.json');
    adminMenu = await resMenu.json();

    populateAllFields();
  } catch (err) {
    console.error('Error al cargar datos en admin:', err);
  }
}

function populateAllFields() {
  const hero = adminConfig.hero || {};
  heroTitleInput.value = hero.title || '';
  heroImageInput.value = hero.image || '';
  heroDescInput.value = hero.description || '';
  heroBadgeLabelInput.value = hero.badgeLabel || '';
  heroBadgeHighlightInput.value = hero.badgeHighlight || '';
  renderHeroFeatures();

  renderAnnouncementsEditor();

  cfgWa.value = adminConfig.whatsappPhone || '522871270483';
  const st = adminConfig.statusOverride || 'auto';
  statusBtns.forEach(btn => {
    if (btn.getAttribute('data-status') === st) {
      btn.className = `status-btn active ${st}`;
    } else {
      btn.className = 'status-btn';
    }
  });

  renderCategoriesEditor();
  renderAdminTable();
}

function renderHeroFeatures() {
  const features = (adminConfig.hero && adminConfig.hero.features) || [];
  heroFeaturesEditor.innerHTML = features.map((f, i) => `
    <div class="list-item-row">
      <select class="form-control" style="width: 180px;" onchange="updateFeatureTag(${i}, 'icon', this.value)">
        ${POPULAR_ICONS.map(item => `
          <option value="${item.icon}" ${f.icon === item.icon ? 'selected' : ''}>${item.label}</option>
        `).join('')}
      </select>
      <input type="text" class="form-control" value="${f.text}" placeholder="Texto etiqueta" onchange="updateFeatureTag(${i}, 'text', this.value)">
      <button class="btn btn-sm btn-outline" style="color: var(--accent-red);" onclick="deleteFeatureTag(${i})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');
}

window.updateFeatureTag = function(index, key, val) {
  adminConfig.hero.features[index][key] = val;
};

window.deleteFeatureTag = function(index) {
  adminConfig.hero.features.splice(index, 1);
  renderHeroFeatures();
};

function renderAnnouncementsEditor() {
  const announcements = adminConfig.announcements || [];
  announcementsEditorList.innerHTML = announcements.map((ann, i) => `
    <div style="background: var(--bg-dark); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px;">
      <div class="grid grid-2" style="margin-bottom: 10px;">
        <input type="text" class="form-control" value="${ann.title}" placeholder="Título Anuncio" onchange="updateAnnouncement(${i}, 'title', this.value)">
        <div>
          <input type="text" class="form-control" value="${ann.image}" placeholder="Ruta Imagen (Ej: assets/CervezadeBarril.png)" onchange="updateAnnouncement(${i}, 'image', this.value); renderAnnouncementsEditor();">
          <span class="form-hint">Ej: assets/CervezadeBarril.png</span>
        </div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <img src="${ann.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/ilovegarage.png'">
        <textarea class="form-control" rows="2" placeholder="Descripción..." onchange="updateAnnouncement(${i}, 'description', this.value)">${ann.description}</textarea>
        <button class="btn btn-sm btn-outline" style="color: var(--accent-red); height: 42px;" onclick="deleteAnnouncement(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.updateAnnouncement = function(index, key, val) {
  adminConfig.announcements[index][key] = val;
};

window.deleteAnnouncement = function(index) {
  adminConfig.announcements.splice(index, 1);
  renderAnnouncementsEditor();
};

function renderCategoriesEditor() {
  const categories = adminConfig.categories || [];
  categoriesEditorList.innerHTML = categories.map((cat, i) => `
    <div class="list-item-row">
      <input type="text" class="form-control" style="width: 140px;" value="${cat.id}" placeholder="ID categoría" onchange="updateCategory(${i}, 'id', this.value)">
      <input type="text" class="form-control" value="${cat.name}" placeholder="Nombre categoría" onchange="updateCategory(${i}, 'name', this.value)">
      <button class="btn btn-sm btn-outline" style="color: var(--accent-red);" onclick="deleteCategory(${i})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');
}

window.updateCategory = function(index, key, val) {
  adminConfig.categories[index][key] = val;
  renderAdminTable();
};

window.deleteCategory = function(index) {
  adminConfig.categories.splice(index, 1);
  renderCategoriesEditor();
  renderAdminTable();
};

function renderAdminTable() {
  const categories = adminConfig.categories || [];

  adminMenuRows.innerHTML = adminMenu.map((item, index) => `
    <tr>
      <td style="text-align: center;">
        <button class="star-btn ${item.isFavorite ? 'active' : ''}" onclick="toggleFavorite(${index})">
          <i class="${item.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
        </button>
      </td>
      <td>
        <img src="${item.image}" class="image-preview-thumbnail" onerror="this.src='assets/ilovegarage.png'">
      </td>
      <td>
        <input type="text" class="form-control" style="width: 180px;" value="${item.image}" placeholder="assets/nombre.png" onchange="updateItem(${index}, 'image', this.value); renderAdminTable();">
      </td>
      <td>
        <input type="text" class="form-control" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)">
      </td>
      <td>
        <select class="form-control" onchange="updateItem(${index}, 'category', this.value)">
          ${categories.map(c => `<option value="${c.id}" ${item.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </td>
      <td>
        <input type="number" class="form-control" value="${item.price}" style="width: 90px;" onchange="updateItem(${index}, 'price', parseFloat(this.value))">
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
};

window.toggleFavorite = function(index) {
  adminMenu[index].isFavorite = !adminMenu[index].isFavorite;
  renderAdminTable();
};

window.toggleAvailability = function(index) {
  adminMenu[index].available = !adminMenu[index].available;
  renderAdminTable();
};

window.deleteItem = function(index) {
  if (confirm(`¿Eliminar ${adminMenu[index].name}?`)) {
    adminMenu.splice(index, 1);
    renderAdminTable();
  }
};

async function saveAllToVercelStorage() {
  if (!adminConfig.hero) adminConfig.hero = {};
  adminConfig.hero.title = heroTitleInput.value.trim();
  adminConfig.hero.image = heroImageInput.value.trim();
  adminConfig.hero.description = heroDescInput.value.trim();
  adminConfig.hero.badgeLabel = heroBadgeLabelInput.value.trim();
  adminConfig.hero.badgeHighlight = heroBadgeHighlightInput.value.trim();
  adminConfig.whatsappPhone = cfgWa.value.trim();

  saveAllVercelBtn.disabled = true;
  saveAllVercelBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

  try {
    const pin = adminConfig.adminPin || '1234';
    const response = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: pin,
        config: adminConfig,
        menu: adminMenu
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      localStorage.removeItem('gb_config_draft');
      localStorage.removeItem('gb_menu_draft');
      alert('¡Excelente! Los cambios se han guardado exitosamente.');
    } else {
      alert('Error guardando: ' + (result.error || 'Intenta de nuevo.'));
    }
  } catch (err) {
    alert('Error de conexión: ' + err.message);
  } finally {
    saveAllVercelBtn.disabled = false;
    saveAllVercelBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Guardar Cambios en Vivo`;
  }
}
