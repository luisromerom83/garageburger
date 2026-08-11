// Admin Dashboard CMS Logic for GarageBurger

let adminMenu = [];
let adminConfig = {};
let availableAssets = [];
let activePickerCallback = null;
let activeUploadCallback = null;

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

function getApiEndpoint(route) {
  if (window.location.hostname.includes('github.io')) {
    const vercelDomain = localStorage.getItem('gb_custom_vercel_domain') || 'https://garageburger.vercel.app';
    return `${vercelDomain}${route}`;
  }
  return route;
}

// Global Image Error Handler for Admin
window.handleAdminImageError = function(imgElement) {
  imgElement.onerror = null;
  imgElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23181b22"/><text x="50%" y="50%" font-size="20" dominant-baseline="middle" text-anchor="middle" fill="%23ff5e00">Sin foto</text></svg>';
};

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const pinInput = document.getElementById('pin-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const saveAllVercelBtn = document.getElementById('save-all-vercel-btn');
const globalFileInput = document.getElementById('global-file-input');

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
const cfgSchedule = document.getElementById('cfg-schedule');
const cfgWa = document.getElementById('cfg-wa');
const cfgPhone2 = document.getElementById('cfg-phone2');
const cfgIg = document.getElementById('cfg-ig');
const cfgFb = document.getElementById('cfg-fb');
const cfgAddress = document.getElementById('cfg-address');
const cfgMaps = document.getElementById('cfg-maps');
const categoriesEditorList = document.getElementById('categories-editor-list');
const addCategoryBtn = document.getElementById('add-category-btn');

// Product Table Inputs
const adminMenuRows = document.getElementById('admin-menu-rows');
const addItemBtn = document.getElementById('add-item-btn');

// Image Picker Modal Elements
const imagePickerModal = document.getElementById('image-picker-modal');
const closePickerBtn = document.getElementById('close-picker-btn');
const pickerGallery = document.getElementById('picker-gallery');

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

  document.querySelectorAll('.upload-trigger-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('data-target');
      triggerFileUpload((uploadedUrl) => {
        document.getElementById(targetId).value = uploadedUrl;
      });
    });
  });

  document.querySelectorAll('.open-explorer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('data-target');
      openImagePicker((selectedPath) => {
        document.getElementById(targetId).value = selectedPath;
      });
    });
  });

  closePickerBtn.addEventListener('click', closeImagePicker);

  globalFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      
      try {
        const uploadUrl = getApiEndpoint('/api/upload');
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            fileName: file.name,
            fileType: file.type
          })
        });

        const data = await response.json();
        if (response.ok && data.url) {
          if (activeUploadCallback) {
            activeUploadCallback(data.url);
          }
          alert('¡Imagen subida con éxito!');
        } else {
          alert('Error al subir imagen: ' + (data.error || 'Intenta de nuevo'));
        }
      } catch (err) {
        alert('Error de conexión subiendo imagen.');
      } finally {
        globalFileInput.value = '';
        activeUploadCallback = null;
      }
    };
    reader.readAsDataURL(file);
  });
}

function triggerFileUpload(onSuccessCallback) {
  activeUploadCallback = onSuccessCallback;
  globalFileInput.click();
}

async function loadAdminData() {
  try {
    const savedConfig = localStorage.getItem('gb_live_config');
    const savedMenu = localStorage.getItem('gb_live_menu');

    let hasLocal = false;
    if (savedConfig && savedMenu) {
      try {
        adminConfig = JSON.parse(savedConfig);
        adminMenu = JSON.parse(savedMenu);
        hasLocal = true;
        populateAllFields();
      } catch (e) {
        console.warn('Invalid local cache');
      }
    }

    const apiUrl = getApiEndpoint('/api/store');
    const resApi = await fetch(apiUrl);
    
    if (resApi.ok) {
      const dataApi = await resApi.json();
      if (dataApi.availableAssets) {
        availableAssets = dataApi.availableAssets || [];
      }
      
      // Only overwrite local state if user hasn't saved local changes yet
      if (!hasLocal && dataApi.config && dataApi.menu) {
        adminConfig = dataApi.config;
        adminMenu = dataApi.menu;
        localStorage.setItem('gb_live_config', JSON.stringify(adminConfig));
        localStorage.setItem('gb_live_menu', JSON.stringify(adminMenu));
        populateAllFields();
        return;
      }
    }

    if (!hasLocal) {
      const resCfg = await fetch('data/config.json');
      adminConfig = await resCfg.json();

      const resMenu = await fetch('data/menu.json');
      adminMenu = await resMenu.json();

      populateAllFields();
    }
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
  if (cfgSchedule) cfgSchedule.value = adminConfig.scheduleText || 'Jueves a Domingo: 7:00 PM - 11:00 PM';
  
  const activeDays = adminConfig.activeDays || [0, 4, 5, 6];
  document.querySelectorAll('.day-chk').forEach(chk => {
    chk.checked = activeDays.includes(parseInt(chk.value, 10));
  });

  const openHrSelect = document.getElementById('cfg-open-hour');
  const closeHrSelect = document.getElementById('cfg-close-hour');
  if (openHrSelect) openHrSelect.value = adminConfig.openHour !== undefined ? adminConfig.openHour : 19;
  if (closeHrSelect) closeHrSelect.value = adminConfig.closeHour !== undefined ? adminConfig.closeHour : 23;

  if (cfgWa) cfgWa.value = adminConfig.whatsappPhone || '522871270483';
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

function openImagePicker(onSelectCallback) {
  activePickerCallback = onSelectCallback;
  imagePickerModal.classList.add('active');

  if (availableAssets.length === 0) {
    availableAssets = [
      { filename: 'Boneless.png', path: 'assets/Boneless.png' },
      { filename: 'CervezadeBarril.png', path: 'assets/CervezadeBarril.png' },
      { filename: 'pulledpork.png', path: 'assets/pulledpork.png' },
      { filename: 'logo.png', path: 'assets/logo.png' },
      { filename: 'Screenshot_20260810_105000.png', path: 'assets/Screenshot_20260810_105000.png' },
      { filename: 'Screenshot_20260810_105331.png', path: 'assets/Screenshot_20260810_105331.png' },
      { filename: 'Screenshot_20260810_105350.png', path: 'assets/Screenshot_20260810_105350.png' },
      { filename: 'menu.jpg', path: 'assets/menu.jpg' }
    ];
  }

  pickerGallery.innerHTML = availableAssets.map(asset => `
    <div class="asset-card" onclick="selectAsset('${asset.path}')">
      <img src="${asset.path}" alt="${asset.filename}" onerror="handleAdminImageError(this)">
      <span>${asset.filename}</span>
    </div>
  `).join('');
}

window.selectAsset = function(path) {
  if (activePickerCallback) {
    activePickerCallback(path);
  }
  closeImagePicker();
};

function closeImagePicker() {
  imagePickerModal.classList.remove('active');
  activePickerCallback = null;
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
        <div style="display: flex; gap: 8px;">
          <input type="text" class="form-control" value="${ann.image}" placeholder="Ruta o URL Imagen" onchange="updateAnnouncement(${i}, 'image', this.value); renderAnnouncementsEditor();">
          <button class="btn btn-sm btn-yellow" onclick="uploadForAnnouncement(${i})"><i class="fa-solid fa-upload"></i> Subir</button>
          <button class="btn btn-sm btn-outline" onclick="openPickerForAnnouncement(${i})"><i class="fa-regular fa-folder-open"></i></button>
        </div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <img src="${ann.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" onerror="handleAdminImageError(this)">
        <textarea class="form-control" rows="2" placeholder="Descripción..." onchange="updateAnnouncement(${i}, 'description', this.value)">${ann.description}</textarea>
        <button class="btn btn-sm btn-outline" style="color: var(--accent-red); height: 42px;" onclick="deleteAnnouncement(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.uploadForAnnouncement = function(index) {
  triggerFileUpload((uploadedUrl) => {
    adminConfig.announcements[index].image = uploadedUrl;
    renderAnnouncementsEditor();
  });
};

window.openPickerForAnnouncement = function(index) {
  openImagePicker((selectedPath) => {
    adminConfig.announcements[index].image = selectedPath;
    renderAnnouncementsEditor();
  });
};

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
        <img src="${item.image}" class="image-preview-thumbnail" onerror="handleAdminImageError(this)">
      </td>
      <td>
        <div style="display: flex; gap: 6px; min-width: 260px;">
          <input type="text" class="form-control" style="font-size: 0.85rem;" value="${item.image}" onchange="updateItem(${index}, 'image', this.value); renderAdminTable();">
          <button class="btn btn-sm btn-yellow" onclick="uploadForProduct(${index})"><i class="fa-solid fa-upload"></i> Subir</button>
          <button class="btn btn-sm btn-outline" onclick="openPickerForProduct(${index})"><i class="fa-regular fa-folder-open"></i></button>
        </div>
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

window.uploadForProduct = function(index) {
  triggerFileUpload((uploadedUrl) => {
    adminMenu[index].image = uploadedUrl;
    renderAdminTable();
  });
};

window.openPickerForProduct = function(index) {
  openImagePicker((selectedPath) => {
    adminMenu[index].image = selectedPath;
    renderAdminTable();
  });
};

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
  if (!adminConfig || typeof adminConfig !== 'object') {
    adminConfig = {};
  }
  if (!adminConfig.hero || typeof adminConfig.hero !== 'object') {
    adminConfig.hero = {};
  }

  if (heroTitleInput) adminConfig.hero.title = heroTitleInput.value.trim();
  if (heroImageInput) adminConfig.hero.image = heroImageInput.value.trim();
  if (heroDescInput) adminConfig.hero.description = heroDescInput.value.trim();
  if (heroBadgeLabelInput) adminConfig.hero.badgeLabel = heroBadgeLabelInput.value.trim();
  if (heroBadgeHighlightInput) adminConfig.hero.badgeHighlight = heroBadgeHighlightInput.value.trim();

  if (cfgSchedule) adminConfig.scheduleText = cfgSchedule.value.trim();

  const selectedDays = [];
  document.querySelectorAll('.day-chk:checked').forEach(chk => {
    selectedDays.push(parseInt(chk.value, 10));
  });
  adminConfig.activeDays = selectedDays;

  const openHrSelect = document.getElementById('cfg-open-hour');
  const closeHrSelect = document.getElementById('cfg-close-hour');
  if (openHrSelect) adminConfig.openHour = parseInt(openHrSelect.value, 10);
  if (closeHrSelect) adminConfig.closeHour = parseInt(closeHrSelect.value, 10);

  if (cfgWa) adminConfig.whatsappPhone = cfgWa.value.trim();
  if (cfgPhone2) adminConfig.secondaryPhone = cfgPhone2.value.trim();
  if (cfgIg) adminConfig.instagramUser = cfgIg.value.trim();
  if (cfgFb) adminConfig.facebookUrl = cfgFb.value.trim();
  if (cfgAddress) adminConfig.addressText = cfgAddress.value.trim();
  if (cfgMaps) adminConfig.mapsUrl = cfgMaps.value.trim();

  // 1. Immediate Instant Persistence in LocalStorage
  localStorage.setItem('gb_live_config', JSON.stringify(adminConfig));
  localStorage.setItem('gb_live_menu', JSON.stringify(adminMenu));

  saveAllVercelBtn.disabled = true;
  saveAllVercelBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

  try {
    const pin = adminConfig.adminPin || '1234';
    const storeUrl = getApiEndpoint('/api/store');

    const response = await fetch(storeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: pin,
        config: adminConfig,
        menu: adminMenu
      })
    });

    if (response.ok) {
      alert('¡Excelente! Los cambios se han guardado exitosamente.');
    } else {
      alert('Cambios guardados localmente.');
    }
  } catch (err) {
    alert('Cambios guardados localmente en tu navegador. ¡Refresca para comprobar!');
  } finally {
    saveAllVercelBtn.disabled = false;
    saveAllVercelBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Guardar Cambios en Vivo`;
  }
}
