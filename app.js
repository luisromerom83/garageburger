// GarageBurger Interactive Application Logic

const MENU_ITEMS = [
  // Hamburguesas & Especiales
  {
    id: 'pulled-pork',
    name: 'Pulled Pork & Brioche',
    category: 'hamburguesas',
    price: 160,
    description: 'Jugosa carne de cerdo desmenuzada marinada en salsa BBQ especial con ensalada de col dulce en pan Brioche.',
    image: 'assets/pulledpork.png',
    badge: 'Especial de la Casa'
  },
  {
    id: 'costillas-bbq',
    name: 'Costillas BBQ Especial',
    category: 'hamburguesas',
    price: 220,
    description: 'Costillas de cerdo ahumadas bañadas en BBQ, puré de papa con gravy, Mac and Cheese o ensalada de col.',
    image: 'assets/Screenshot_20260810_105000.png',
    badge: 'Estrella'
  },
  {
    id: 'garage-burger-double',
    name: 'Doble Garage Burger',
    category: 'hamburguesas',
    price: 180,
    description: 'Doble carne de res sazonada, queso gouda fundido, tocino crujiente, cebolla caramelizada y aderezo especial.',
    image: 'assets/Screenshot_20260810_105331.png',
    badge: 'Popular'
  },
  {
    id: 'garage-burger-classic',
    name: 'Clásica Garage Burger',
    category: 'hamburguesas',
    price: 120,
    description: '100% carne de res jugosa, queso amarillo, lechuga fresca, jitomate y aderezo Garage.',
    image: 'assets/Screenshot_20260810_105350.png',
    badge: ''
  },

  // Boneless & Snacks
  {
    id: 'boneless-150',
    name: 'Boneless Bañados o Naturales',
    category: 'boneless',
    price: 150,
    description: 'Trozos de pechuga crujientes bañados en tu salsa favorita, acompañados de aderezo ranch, papas o aros de cebolla.',
    image: 'assets/Boneless.png',
    badge: 'Recomendado'
  },
  {
    id: 'bolitas-queso',
    name: 'Bolitas de Queso Gouda',
    category: 'boneless',
    price: 70,
    description: 'Queso gouda sazonado y empanizado crujiente. 8 piezas acompañadas de dip.',
    image: 'assets/Screenshot_20260810_105331.png',
    badge: 'Snack'
  },
  {
    id: 'aros-cebolla',
    name: 'Aros de Cebolla Crujientes',
    category: 'boneless',
    price: 65,
    description: 'Aros de cebolla dorados y sazonados con especias secretas.',
    image: 'assets/Screenshot_20260810_105331.png',
    badge: 'Crujiente'
  },

  // Cervezas & Bebidas
  {
    id: 'cerveza-barril',
    name: 'Cerveza de Barril Helada',
    category: 'bebidas',
    price: 50,
    description: 'Tarro helado de cerveza de barril de la casa.',
    image: 'assets/CervezadeBarril.png',
    badge: 'Favorito'
  },
  {
    id: 'cerveza-cuartito',
    name: 'Cerveza Cuartito',
    category: 'bebidas',
    price: 25,
    description: 'Presentación cuartito bien fría.',
    image: 'assets/CervezadeBarril.png',
    badge: ''
  },
  {
    id: 'cerveza-media',
    name: 'Cerveza Media',
    category: 'bebidas',
    price: 30,
    description: 'Presentación media bien fría.',
    image: 'assets/CervezadeBarril.png',
    badge: ''
  },
  {
    id: 'cerveza-raiz',
    name: 'Cerveza de Raíz',
    category: 'bebidas',
    price: 70,
    description: 'Refrescante cerveza de raíz artesanal.',
    image: 'assets/CervezadeBarril.png',
    badge: ''
  },
  {
    id: 'cerveza-flotante',
    name: 'Cerveza de Raíz con Flotante',
    category: 'bebidas',
    price: 100,
    description: 'Cerveza de raíz con bola de nieve de vainilla cremosa.',
    image: 'assets/CervezadeBarril.png',
    badge: 'Especial'
  },
  {
    id: 'refresco',
    name: 'Refresco de Lata',
    category: 'bebidas',
    price: 25,
    description: 'Variedad de sabores bien fríos.',
    image: 'assets/CervezadeBarril.png',
    badge: ''
  },
  {
    id: 'agua-natural',
    name: 'Agua Natural Botella',
    category: 'bebidas',
    price: 15,
    description: 'Botella de agua purificada 600ml.',
    image: 'assets/CervezadeBarril.png',
    badge: ''
  },

  // Salsas
  {
    id: 'salsa-crema-habanero',
    name: 'Salsa Crema de Habanero',
    category: 'salsas',
    price: 15,
    description: 'Cremosa y picante, hecha en casa.',
    image: 'assets/menu.jpg',
    badge: 'Artesanal'
  },
  {
    id: 'salsa-pina-habanero',
    name: 'Salsa Piña Habanero',
    category: 'salsas',
    price: 15,
    description: 'Toque dulce de piña caramelizada con picor de habanero.',
    image: 'assets/menu.jpg',
    badge: 'Top'
  },
  {
    id: 'salsa-mango-habanero',
    name: 'Salsa Mango Habanero',
    category: 'salsas',
    price: 15,
    description: 'Sabor frutal intenso con verdadero habanero.',
    image: 'assets/menu.jpg',
    badge: 'Top'
  },
  {
    id: 'salsa-bbq-chipotle',
    name: 'Salsa BBQ Chipotle',
    category: 'salsas',
    price: 15,
    description: 'Ahuma perfecto con el toque ahumado del chipotle.',
    image: 'assets/menu.jpg',
    badge: ''
  },

  // Extras
  {
    id: 'extra-queso',
    name: 'Extra Queso Amarillo',
    category: 'extras',
    price: 15,
    description: 'Porción extra de queso fundido.',
    image: 'assets/menu.jpg',
    badge: ''
  },
  {
    id: 'extra-ranch',
    name: 'Aderezo Ranch',
    category: 'extras',
    price: 25,
    description: 'Porción de aderezo ranch cremoso.',
    image: 'assets/menu.jpg',
    badge: ''
  },
  {
    id: 'extra-aderezo-burger',
    name: 'Aderezo Burger',
    category: 'extras',
    price: 35,
    description: 'Aderezo secreto de la casa Garage.',
    image: 'assets/menu.jpg',
    badge: 'Secreto'
  },
  {
    id: 'extra-ensalada-col',
    name: 'Ensalada de Col Dulce',
    category: 'extras',
    price: 25,
    description: 'Porción individual de cole slaw dulce y crujiente.',
    image: 'assets/menu.jpg',
    badge: ''
  }
];

// State
let cart = [];

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderMenu(MENU_ITEMS);
  checkOperatingStatus();
  setupEventListeners();
});

// Render Menu Cards
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

  menuGrid.innerHTML = items.map(item => `
    <div class="card" data-category="${item.category}">
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/ilovegarage.png'">
        ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
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

  // Re-attach add to cart click listeners
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      addToCart(id);
    });
  });
}

// Filter and Search Logic
function setupEventListeners() {
  // Filter Tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      
      const query = searchInput.value.toLowerCase().trim();
      filterMenu(cat, query);
    });
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    const activeTab = document.querySelector('.filter-btn.active').getAttribute('data-category');
    const query = e.target.value.toLowerCase().trim();
    filterMenu(activeTab, query);
  });

  // Direct add buttons on static elements
  document.querySelectorAll('.add-to-cart-direct').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      addToCart(id);
      openCartDrawer();
    });
  });

  // Cart Drawer open/close
  cartBtn.addEventListener('click', openCartDrawer);
  closeDrawerBtn.addEventListener('click', closeCartDrawer);
  drawerOverlay.addEventListener('click', closeCartDrawer);

  // WhatsApp Checkout
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

// Cart State Management
function addToCart(itemId) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  const existingIndex = cart.findIndex(ci => ci.id === itemId);

  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  updateCartUI();

  // Highlight cart button animation
  cartBtn.style.transform = 'scale(1.1)';
  setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
}

function updateCartQty(itemId, delta) {
  const index = cart.findIndex(ci => ci.id === itemId);
  if (index === -1) return;

  cart[index].qty += delta;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCartUI();
}

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

// Generate formatted WhatsApp message
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

  const phone = '522871270483';
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

  window.open(waUrl, '_blank');
}

// Check Operating Hours Logic (Jueves a Domingo 7:00 PM a 11:00 PM)
function checkOperatingStatus() {
  const now = new Date();
  const day = now.getDay(); // 0 = Domingo, 4 = Jueves, 5 = Viernes, 6 = Sábado
  const hour = now.getHours();

  // Jueves(4), Viernes(5), Sábado(6), Domingo(0) entre 19h (7PM) y 23h (11PM)
  const isOperatingDay = [0, 4, 5, 6].includes(day);
  const isOperatingHour = hour >= 19 && hour < 23;

  if (isOperatingDay && isOperatingHour) {
    statusBadge.className = 'badge-status open';
    statusText.textContent = 'ABIERTO AHORA';
  } else {
    statusBadge.className = 'badge-status closed';
    statusText.textContent = 'CERRADO (Abrimos Jue-Dom 7PM)';
  }
}
