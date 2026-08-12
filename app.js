// GarageBurger Dynamic Application Logic (JSON CMS + Vercel Storage API)

let MENU_ITEMS = [];
let STORE_CONFIG = {};
let cart = [];
let currentCarouselIndex = 0;
let carouselInterval = null;

// Helper: Smart Vercel API Base Resolver
function getApiEndpoint(route) {
  if (window.location.hostname.includes('github.io')) {
    return `https://garageburger.vercel.app${route}`;
  }
  return route;
}

// Global Image Error Handler (prevents infinite 404 loops)
window.handleImageError = function(imgElement) {
  imgElement.onerror = null;
  imgElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23181b22"/><text x="50%" y="50%" font-size="30" dominant-baseline="middle" text-anchor="middle" fill="%23ff5e00">🍔</text></svg>';
};

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const categoryFilterTabs = document.getElementById('category-filter-tabs');
const searchInput = document.getElementById('menu-search');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const closeDrawerBtn = document.getElementById('close-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');
const checkoutWaBtn = document.getElementById('checkout-wa-btn');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');

// Initialize Application with JSON Fetch
document.addEventListener('DOMContentLoaded', async () => {
  await loadStoreData();
  applyStoreConfig();
  renderFavorites();
  renderCategoryTabs();
  renderMenu(MENU_ITEMS);
  setupEventListeners();
  initCarousel();
});

// Load Config & Menu from Vercel API, JSON or LocalStorage Draft Override
async function loadStoreData() {
  try {
    const apiUrl = getApiEndpoint(`/api/store?t=${Date.now()}`);
    const resApi = await fetch(apiUrl, { cache: 'no-store' });
    
    if (resApi.ok) {
      const contentType = resApi.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const dataApi = await resApi.json();
        if (dataApi.config && dataApi.menu) {
          STORE_CONFIG = dataApi.config;
          MENU_ITEMS = dataApi.menu;
          localStorage.setItem('gb_live_config', JSON.stringify(STORE_CONFIG));
          localStorage.setItem('gb_live_menu', JSON.stringify(MENU_ITEMS));
          return;
        }
      }
    }

    const liveCfg = localStorage.getItem('gb_live_config');
    const liveMenu = localStorage.getItem('gb_live_menu');

    if (liveCfg && liveMenu) {
      STORE_CONFIG = JSON.parse(liveCfg);
      MENU_ITEMS = JSON.parse(liveMenu);
      return;
    }

    const resCfg = await fetch('data/config.json');
    STORE_CONFIG = await resCfg.json();

    const resMenu = await fetch('data/menu.json');
    MENU_ITEMS = await resMenu.json();
  } catch (err) {
    console.error('Error al cargar datos de tienda:', err);
  }
}

// Apply Store Config
function applyStoreConfig() {
  if (STORE_CONFIG.storeName) document.getElementById('nav-brand-title').textContent = STORE_CONFIG.storeName;
  if (STORE_CONFIG.storeSubtitle) document.getElementById('nav-brand-subtitle').textContent = STORE_CONFIG.storeSubtitle;

  const topAnnouncement = document.getElementById('top-announcement-text');
  if (topAnnouncement && STORE_CONFIG.announcementText) {
    topAnnouncement.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${STORE_CONFIG.announcementText}`;
  }

  const phone = STORE_CONFIG.whatsappPhone || '522871270483';
  const waUrl = `https://wa.me/${phone}`;

  document.getElementById('top-whatsapp-link').href = waUrl;
  document.getElementById('hero-wa-btn').href = waUrl;
  document.getElementById('direct-wa-chat-btn').href = waUrl;
  document.getElementById('footer-wa').href = waUrl;

  if (STORE_CONFIG.scheduleText) {
    document.getElementById('schedule-text-info').textContent = STORE_CONFIG.scheduleText;
  }

  const phone2Text = STORE_CONFIG.secondaryPhone ? ` / ${STORE_CONFIG.secondaryPhone}` : '';
  document.getElementById('phones-text-info').textContent = `${phone}${phone2Text}`;

  if (STORE_CONFIG.instagramUser) {
    const igUrl = `https://instagram.com/${STORE_CONFIG.instagramUser.replace('@', '')}`;
    document.getElementById('instagram-link').href = igUrl;
    document.getElementById('instagram-link').textContent = `@${STORE_CONFIG.instagramUser.replace('@', '')}`;
    document.getElementById('footer-ig').href = igUrl;
  }

  if (STORE_CONFIG.facebookUrl) {
    document.getElementById('facebook-link').href = STORE_CONFIG.facebookUrl;
  }

  if (STORE_CONFIG.addressText) {
    document.getElementById('address-text-info').textContent = STORE_CONFIG.addressText;
  }

  if (STORE_CONFIG.mapsUrl) {
    document.getElementById('address-link').href = STORE_CONFIG.mapsUrl;
  }

  const hero = STORE_CONFIG.hero || {};
  if (hero.title) document.getElementById('hero-title').innerHTML = hero.title;
  if (hero.description) document.getElementById('hero-description').textContent = hero.description;
  if (hero.image) document.getElementById('hero-img').src = hero.image;
  if (hero.badgeLabel) document.getElementById('hero-badge-label').textContent = hero.badgeLabel;
  if (hero.badgeHighlight) document.getElementById('hero-badge-highlight').textContent = hero.badgeHighlight;

  if (hero.features && hero.features.length > 0) {
    const featuresContainer = document.getElementById('hero-features-list');
    featuresContainer.innerHTML = hero.features.map(f => `
      <div class="feature-item">
        <i class="fa-solid ${f.icon || 'fa-star'}"></i>
        <span>${f.text}</span>
      </div>
    `).join('');
  }

  checkOperatingStatus();
}

function checkOperatingStatus() {
  const override = STORE_CONFIG.statusOverride || 'auto';

  if (override === 'open') {
    statusBadge.className = 'badge-status open';
    statusText.textContent = 'ABIERTO AHORA';
    return;
  }

  if (override === 'closed') {
    statusBadge.className = 'badge-status closed';
    statusText.textContent = 'CERRADO POR EL MOMENTO';
    return;
  }

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const activeDays = STORE_CONFIG.activeDays || [0, 4, 5, 6];
  const openHour = STORE_CONFIG.openHour !== undefined ? STORE_CONFIG.openHour : 19;
  const closeHour = STORE_CONFIG.closeHour !== undefined ? STORE_CONFIG.closeHour : 23;

  const isOperatingDay = activeDays.includes(day);
  let isOperatingHour = false;

  if (closeHour > openHour) {
    isOperatingHour = hour >= openHour && hour < closeHour;
  } else {
    // Overnight schedule (e.g. 7:00 PM to 2:00 AM)
    isOperatingHour = hour >= openHour || hour < closeHour;
  }

  if (isOperatingDay && isOperatingHour) {
    statusBadge.className = 'badge-status open';
    statusText.textContent = 'ABIERTO AHORA';
  } else {
    statusBadge.className = 'badge-status closed';
    statusText.textContent = `CERRADO (${STORE_CONFIG.scheduleText || 'Horario en sitio'})`;
  }
}

function initCarousel() {
  const announcements = STORE_CONFIG.announcements || [];
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (announcements.length === 0) {
    document.querySelector('.announcement-carousel-section').style.display = 'none';
    return;
  }

  document.querySelector('.announcement-carousel-section').style.display = 'block';

  track.innerHTML = announcements.map(ann => `
    <div class="carousel-slide">
      <div class="slide-content">
        <h2>${ann.title}</h2>
        <p>${ann.description}</p>
      </div>
      <div class="slide-img-wrap">
        <img src="${ann.image}" alt="${ann.title}" onerror="handleImageError(this)">
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = announcements.map((_, i) => `
    <span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>
  `).join('');

  prevBtn.onclick = () => {
    currentCarouselIndex = (currentCarouselIndex - 1 + announcements.length) % announcements.length;
    updateCarousel();
  };

  nextBtn.onclick = () => {
    currentCarouselIndex = (currentCarouselIndex + 1) % announcements.length;
    updateCarousel();
  };

  startAutoPlay(announcements.length);
}

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  const dots = document.querySelectorAll('.carousel-dots .dot');

  track.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;

  dots.forEach((dot, i) => {
    dot.className = `dot ${i === currentCarouselIndex ? 'active' : ''}`;
  });
}

window.goToSlide = function(index) {
  currentCarouselIndex = index;
  updateCarousel();
};

function startAutoPlay(length) {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    currentCarouselIndex = (currentCarouselIndex + 1) % length;
    updateCarousel();
  }, 6000);
}

function renderFavorites() {
  const favoritesGrid = document.getElementById('favorites-grid');
  const favorites = MENU_ITEMS.filter(item => item.isFavorite === true);

  if (favorites.length === 0) {
    favoritesGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Próximamente más recomendados...</p>`;
    return;
  }

  favoritesGrid.innerHTML = favorites.map(item => `
    <div class="card card-special">
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.name}" onerror="handleImageError(this)">
        <span class="card-badge badge-yellow">⭐ Favorito</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-text">${item.description}</p>
        <div class="card-footer">
          <span class="price">$${item.price} MXN</span>
          <button class="btn btn-sm btn-outline add-to-cart-btn" data-id="${item.id}">
            <i class="fa-solid fa-plus"></i> Agregar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCategoryTabs() {
  const categories = STORE_CONFIG.categories || [
    { id: 'todos', name: 'Todos' },
    { id: 'hamburguesas', name: 'Hamburguesas & Specials' },
    { id: 'boneless', name: 'Boneless & Snacks' },
    { id: 'bebidas', name: 'Cervezas & Bebidas' },
    { id: 'salsas', name: 'Salsas & Aderezos' },
    { id: 'extras', name: 'Extras' }
  ];

  let html = `<button class="filter-btn active" data-category="todos">Todos</button>`;
  categories.forEach(cat => {
    if (cat.id !== 'todos') {
      html += `<button class="filter-btn" data-category="${cat.id}">${cat.name}</button>`;
    }
  });

  categoryFilterTabs.innerHTML = html;
}

function renderMenu(items) {
  if (items.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-ghost" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
        <p>No encontramos ningún platillo con esa búsqueda.</p>
      </div>
    `;
    return;
  }

  menuGrid.innerHTML = items.map(item => {
    const isAvailable = item.available !== false;
    return `
      <div class="card ${!isAvailable ? 'unavailable-card' : ''}" data-category="${item.category}" style="${!isAvailable ? 'opacity: 0.55; filter: grayscale(0.6);' : ''}">
        <div class="card-img-wrap">
          <img src="${item.image}" alt="${item.name}" onerror="handleImageError(this)">
          ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
          ${!isAvailable ? `<span class="card-badge badge-red" style="left: 12px; right: auto;">AGOTADO</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">${item.description}</p>
          <div class="card-footer">
            <span class="price">$${item.price} MXN</span>
            ${isAvailable ? `
              <button class="btn btn-sm btn-outline add-to-cart-btn" data-id="${item.id}">
                <i class="fa-solid fa-plus"></i> Agregar
              </button>
            ` : `
              <span style="font-size: 0.85rem; color: var(--accent-red); font-weight: 700;">No Disponible</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      addToCart(id);
    });
  });
}

function setupEventListeners() {
  categoryFilterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('#category-filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const cat = e.target.getAttribute('data-category');
      const query = searchInput.value.toLowerCase().trim();
      filterMenu(cat, query);
    }
  });

  searchInput.addEventListener('input', (e) => {
    const activeTabEl = document.querySelector('#category-filter-tabs .filter-btn.active');
    const activeTab = activeTabEl ? activeTabEl.getAttribute('data-category') : 'todos';
    const query = e.target.value.toLowerCase().trim();
    filterMenu(activeTab, query);
  });

  cartBtn.addEventListener('click', openCartDrawer);
  closeDrawerBtn.addEventListener('click', closeCartDrawer);
  drawerOverlay.addEventListener('click', closeCartDrawer);

  checkoutWaBtn.addEventListener('click', sendWhatsAppOrder);
}

function filterMenu(category, query) {
  let filtered = MENU_ITEMS;

  if (category !== 'todos') {
    filtered = filtered.filter(item => item.category === category);
  }

  if (query) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
  }

  renderMenu(filtered);
}

function addToCart(itemId) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item || item.available === false) return;

  const existingIndex = cart.findIndex(ci => ci.id === itemId);

  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  updateCartUI();
  cartBtn.style.transform = 'scale(1.1)';
  setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
}

window.updateCartQty = function(itemId, delta) {
  const index = cart.findIndex(ci => ci.id === itemId);
  if (index === -1) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);

  updateCartUI();
};

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  cartCount.textContent = totalCount;
  cartSubtotal.textContent = `$${totalPrice} MXN`;
  cartTotal.textContent = `$${totalPrice} MXN`;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Tu carrito está vacío</p>
        <button class="btn btn-sm btn-primary" onclick="closeCartDrawer()">Ver Menú</button>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>$${item.price} MXN c/u</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');
}

function openCartDrawer() {
  cartDrawer.classList.add('active');
}

function closeCartDrawer() {
  cartDrawer.classList.remove('active');
}

function sendWhatsAppOrder() {
  if (cart.length === 0) {
    alert('Por favor agrega platillos a tu pedido antes de enviar.');
    return;
  }

  const notes = document.getElementById('order-notes').value.trim();
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  let message = `🍔 *NUEVO PEDIDO - GARAGE BURGER* 🍺\n\n`;
  message += `*Detalle del pedido:*\n`;

  cart.forEach(item => {
    message += `• ${item.qty}x ${item.name} - $${item.price * item.qty} MXN\n`;
  });

  message += `\n*Total Estimado:* $${total} MXN\n`;

  if (notes) {
    message += `*Notas / Salsas:* ${notes}\n`;
  }

  message += `\n¡Hola! Quisiera realizar este pedido. Por favor me confirman el tiempo estimado y lugar de entrega/recogida.`;

  const phone = STORE_CONFIG.whatsappPhone || '522871270483';
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

  window.open(waUrl, '_blank');
}
