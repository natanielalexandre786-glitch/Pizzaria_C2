/* ================================================
   DESK PIZZARIA — MAIN.JS
   Carrinho de compras, seletores de tamanho, animações
   ================================================ */

"use strict";

// ---- STATE ----
let cart = [];
let toastTimeout = null;

// ---- DOM REFS ----
const cartBtn      = document.getElementById('cartBtn');
const cartBadge    = document.getElementById('cartBadge');
const cartSidebar  = document.getElementById('cartSidebar');
const cartOverlay  = document.getElementById('cartOverlay');
const cartClose    = document.getElementById('cartClose');
const cartBody     = document.getElementById('cartBody');
const cartEmpty    = document.getElementById('cartEmpty');
const cartList     = document.getElementById('cartList');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal    = document.getElementById('cartTotal');
const checkoutBtn  = document.getElementById('checkoutBtn');
const toast        = document.getElementById('toast');
const toastMsg     = document.getElementById('toastMsg');
const header       = document.getElementById('header');

// ---- CART OPEN / CLOSE ----
function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});

// ---- ADD TO CART (pizza com tamanho) ----
function addToCart(productName, productKey) {
  const selector = document.querySelector(`.size-selector[data-product="${productKey}"]`);
  if (!selector) return;

  const activeBtn = selector.querySelector('.size-btn.active');
  const size      = activeBtn ? activeBtn.dataset.size : 'M';
  const prices    = JSON.parse(selector.dataset.prices || '{}');
  const price     = prices[size] || 0;
  const itemLabel = `${productName} (${size})`;

  addItemToCart(itemLabel, price, size);
}

// ---- ADD TO CART (item fixo sem tamanho) ----
function addToCartFixed(productName, price) {
  addItemToCart(productName, price, null);
}

// ---- CORE ADD ITEM LOGIC ----
function addItemToCart(name, price, size) {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  const existing = cart.find(item => item.key === key);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ key, name, price, size, qty: 1 });
  }

  renderCart();
  updateBadge();
  showToast(`${name} adicionado ao carrinho!`);
}

// ---- REMOVE / QTY CONTROL ----
function changeQty(key, delta) {
  const idx = cart.findIndex(item => item.key === key);
  if (idx === -1) return;

  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }

  renderCart();
  updateBadge();
}

// ---- RENDER CART ----
function renderCart() {
  cartList.innerHTML = '';

  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartList.style.display  = 'none';
  } else {
    cartEmpty.style.display = 'none';
    cartList.style.display  = 'flex';

    cart.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-detail">
            ${item.size ? `Tamanho: <strong>${item.size}</strong> · ` : ''}
            Unitário: ${formatBRL(item.price)}
          </div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn remove" onclick="changeQty('${item.key}', -1)" aria-label="Remover 1">
            ${item.qty === 1 ? '<i class="fas fa-trash-alt" style="font-size:0.75rem"></i>' : '−'}
          </button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.key}', 1)" aria-label="Adicionar 1">+</button>
        </div>
        <div class="cart-item-price">${formatBRL(item.price * item.qty)}</div>
      `;
      cartList.appendChild(li);
    });
  }

  updateTotals();
}

// ---- TOTALS ----
function updateTotals() {
  const delivery = cart.length > 0 ? 5.00 : 0;
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const total    = subtotal + delivery;

  cartSubtotal.textContent = formatBRL(subtotal);
  cartTotal.textContent    = formatBRL(total);
}

// ---- BADGE ----
function updateBadge() {
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  cartBadge.textContent = count;

  if (count > 0) {
    cartBadge.classList.add('visible');
  } else {
    cartBadge.classList.remove('visible');
  }
}

// ---- TOAST ----
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---- FORMAT BRL ----
function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- SIZE SELECTOR ----
document.querySelectorAll('.size-selector').forEach(selector => {
  const buttons  = selector.querySelectorAll('.size-btn');
  const prices   = JSON.parse(selector.dataset.prices || '{}');
  const priceKey = selector.dataset.product;
  const priceEl  = document.getElementById(`price-${priceKey}`);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const size = btn.dataset.size;
      if (priceEl && prices[size]) {
        priceEl.textContent = formatBRL(prices[size]);
        priceEl.classList.add('price-flash');
        setTimeout(() => priceEl.classList.remove('price-flash'), 400);
      }
    });
  });
});

// ---- CHECKOUT VIA WHATSAPP ----
checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Seu carrinho está vazio!');
    return;
  }

  const lines = cart.map(item =>
    `• ${item.name}${item.size ? ` (${item.size})` : ''} x${item.qty} — ${formatBRL(item.price * item.qty)}`
  );

  const subtotal  = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const total     = subtotal + 5;
  const orderText = [
    '🍕 *Pedido — Desk Pizzaria*',
    '',
    ...lines,
    '',
    `📦 Subtotal: ${formatBRL(subtotal)}`,
    `🛵 Entrega: ${formatBRL(5)}`,
    `💰 *Total: ${formatBRL(total)}*`,
  ].join('\n');

  const waURL = `https://wa.me/5581999999999?text=${encodeURIComponent(orderText)}`;
  window.open(waURL, '_blank');
});

// ---- HEADER SCROLL EFFECT ----
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, { passive: true });

// ---- SMOOTH SCROLL (nav links) ----
document.querySelectorAll('.nav-link, .hero-cta').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 80; // header height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

// ---- INTERSECTION OBSERVER (card entrance animation) ----
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger based on sibling index
      const siblings = entry.target.parentElement.querySelectorAll('.product-card');
      let idx = 0;
      siblings.forEach((sib, j) => { if (sib === entry.target) idx = j; });

      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, idx * 80);

      cardObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Prepare cards for animation
document.querySelectorAll('.product-card').forEach(card => {
  card.style.opacity    = '0';
  card.style.transform  = 'translateY(30px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s, border-color 0.3s';
  cardObserver.observe(card);
});

// ---- INIT ----
renderCart();
updateBadge();
