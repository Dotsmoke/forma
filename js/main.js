/* ==========================================================================
   ORIEL — main.js
   Vanilla JS: navigation, cart, wishlist, filters, sort, tabs,
   accordion, testimonial slider, search overlay, scroll reveals.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* PRODUCT DATA                                                            */
/* ---------------------------------------------------------------------- */
const PRODUCTS = [
  { id:'p1', name:'Aria Lounge Chair', category:'living', price:24999, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=700&q=80',
    tag:'New', date:'2026-02-01' },
  { id:'p2', name:'Oslo Oak Dining Table', category:'dining', price:54000, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-11-12' },
  { id:'p3', name:'Noma Lounge Sofa', category:'living', price:68500, oldPrice:78000,
    imgA:'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=700&q=80',
    tag:'Sale', date:'2025-09-03' },
  { id:'p4', name:'Haven Bed', category:'bedroom', price:39900, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-08-19' },
  { id:'p5', name:'Forma Sideboard', category:'storage', price:32500, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2026-01-22' },
  { id:'p6', name:'Arc Accent Chair', category:'living', price:18999, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=700&q=80',
    tag:'New', date:'2026-03-02' },
  { id:'p7', name:'Atelier Coffee Table', category:'living', price:14500, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1554295405-abb8fd54f153?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-06-14' },
  { id:'p8', name:'Linea Console', category:'storage', price:21999, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-12-08' },
  { id:'p9', name:'Terra Dining Chair', category:'dining', price:8999, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-10-27' },
  { id:'p10', name:'Cove Bedside Table', category:'bedroom', price:9500, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-07-30' },
  { id:'p11', name:'Mono Bookshelf', category:'office', price:27999, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80',
    tag:null, date:'2025-05-11' },
  { id:'p12', name:'Eden Sofa', category:'living', price:72000, oldPrice:null,
    imgA:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80',
    imgB:'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?auto=format&fit=crop&w=700&q=80',
    tag:'New', date:'2026-03-18' },
];

const money = n => '₹' + n.toLocaleString('en-IN');

/* ---------------------------------------------------------------------- */
/* STATE                                                                   */
/* ---------------------------------------------------------------------- */
const state = {
  filter: 'all',
  sort: 'featured',
  wishlist: new Set(),
  cart: [], // {id, qty}
};

function cartCount(){ return state.cart.reduce((s,i)=>s+i.qty, 0); }
function cartTotal(){
  return state.cart.reduce((sum, item) => {
    const p = PRODUCTS.find(p=>p.id===item.id);
    return sum + (p ? p.price*item.qty : 0);
  }, 0);
}

/* ---------------------------------------------------------------------- */
/* PRODUCT CARD RENDERING                                                  */
/* ---------------------------------------------------------------------- */
function productCardHTML(p){
  const wished = state.wishlist.has(p.id);
  return `
  <article class="p-card reveal in" data-id="${p.id}" data-cat="${p.category}" data-price="${p.price}" data-date="${p.date}">
    <div class="p-media">
      ${p.tag ? `<span class="p-tag">${p.tag}</span>` : ''}
      <button class="p-wish ${wished ? 'active' : ''}" aria-label="Add ${p.name} to wishlist" data-wish="${p.id}">
        <svg viewBox="0 0 24 24" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4 6 4c2.2 0 3.7 1.3 4.6 2.6C11.5 5.3 13 4 15.2 4c4 0 5.5 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
      </button>
      <img class="img-a" src="${p.imgA}" alt="${p.name}" loading="lazy">
      <img class="img-b" src="${p.imgB}" alt="${p.name}, alternate view" loading="lazy">
      <button class="p-quickadd" data-add="${p.id}">Quick add — ${money(p.price)}</button>
    </div>
    <div class="p-cat">${p.category}</div>
    <h3 class="p-name">${p.name}</h3>
    <div class="p-price">${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}${money(p.price)}</div>
  </article>`;
}

function renderProducts(){
  const grid = document.getElementById('productGrid');
  if(!grid) return;

  let list = PRODUCTS.filter(p => state.filter === 'all' || p.category === state.filter);

  switch(state.sort){
    case 'newest':
      list = list.sort((a,b)=> new Date(b.date) - new Date(a.date)); break;
    case 'price-asc':
      list = list.sort((a,b)=> a.price - b.price); break;
    case 'price-desc':
      list = list.sort((a,b)=> b.price - a.price); break;
    default: break; // featured = original order
  }

  grid.style.opacity = 0;
  setTimeout(() => {
    grid.innerHTML = list.map(productCardHTML).join('');
    grid.style.opacity = 1;
    bindProductEvents();
  }, 160);
}

function bindProductEvents(){
  document.querySelectorAll('[data-wish]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.wish;
      if(state.wishlist.has(id)){ state.wishlist.delete(id); }
      else { state.wishlist.add(id); showToast('Added to wishlist'); }
      btn.classList.toggle('active');
      updateWishCount();
    });
  });
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.add);
    });
  });
}

/* ---------------------------------------------------------------------- */
/* FILTER + SORT CONTROLS                                                  */
/* ---------------------------------------------------------------------- */
function initFilters(){
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      state.filter = pill.dataset.filter;
      renderProducts();
    });
  });
  const sortSel = document.getElementById('sortSelect');
  if(sortSel){
    sortSel.addEventListener('change', () => {
      state.sort = sortSel.value;
      renderProducts();
    });
  }
  document.querySelectorAll('[data-cat-link]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = el.dataset.catLink;
      state.filter = cat;
      document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.filter === cat));
      renderProducts();
      document.getElementById('shop')?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

/* ---------------------------------------------------------------------- */
/* CART                                                                    */
/* ---------------------------------------------------------------------- */
function addToCart(id){
  const existing = state.cart.find(i => i.id === id);
  if(existing){ existing.qty += 1; }
  else{ state.cart.push({id, qty:1}); }
  renderCart();
  updateCartCount();
  showToast('Added to bag');
  openCart();
}

function changeQty(id, delta){
  const item = state.cart.find(i => i.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ state.cart = state.cart.filter(i => i.id !== id); }
  renderCart();
  updateCartCount();
}

function renderCart(){
  const wrap = document.getElementById('cartItems');
  const foot = document.getElementById('cartFoot');
  if(!wrap) return;

  if(state.cart.length === 0){
    wrap.innerHTML = `<div class="cart-empty">Your bag is empty.<br>Explore the collection to find something to love.</div>`;
    if(foot) foot.style.display = 'none';
    return;
  }
  if(foot) foot.style.display = 'block';

  wrap.innerHTML = state.cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if(!p) return '';
    return `
    <div class="cart-item">
      <img src="${p.imgA}" alt="${p.name}">
      <div class="cart-item-info">
        <h4>${p.name}</h4>
        <div class="meta">${money(p.price)} · ${p.category}</div>
        <div class="qty-control">
          <button data-qty-minus="${p.id}">–</button>
          <span>${item.qty}</span>
          <button data-qty-plus="${p.id}">+</button>
          <button class="cart-remove" data-remove="${p.id}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('cartSubtotal').textContent = money(cartTotal());

  wrap.querySelectorAll('[data-qty-plus]').forEach(b => b.addEventListener('click', () => changeQty(b.dataset.qtyPlus, 1)));
  wrap.querySelectorAll('[data-qty-minus]').forEach(b => b.addEventListener('click', () => changeQty(b.dataset.qtyMinus, -1)));
  wrap.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    state.cart = state.cart.filter(i => i.id !== b.dataset.remove);
    renderCart(); updateCartCount();
  }));
}

function updateCartCount(){
  const el = document.getElementById('cartCount');
  if(el) el.textContent = cartCount();
}
function updateWishCount(){
  const el = document.getElementById('wishCount');
  if(el) el.textContent = state.wishlist.size;
}

function openCart(){
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('overlayBg')?.classList.add('show');
}
function closeCart(){
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('overlayBg')?.classList.remove('show');
}

/* ---------------------------------------------------------------------- */
/* TOAST                                                                   */
/* ---------------------------------------------------------------------- */
let toastTimer;
function showToast(msg){
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 2200);
}

/* ---------------------------------------------------------------------- */
/* NAV: scroll state, mobile menu, cart/search open-close                  */
/* ---------------------------------------------------------------------- */
function initNav(){
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  const burger = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', open);
  });
  document.getElementById('mobileMenuClose').addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
  }));

  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('overlayBg').addEventListener('click', () => {
    closeCart();
    closeSearch();
  });

  document.getElementById('searchBtn').addEventListener('click', openSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);
}

function openSearch(){
  document.getElementById('searchOverlay').classList.add('show');
  setTimeout(()=> document.getElementById('searchInput')?.focus(), 300);
}
function closeSearch(){
  document.getElementById('searchOverlay').classList.remove('show');
}

/* ---------------------------------------------------------------------- */
/* MATERIAL TABS                                                           */
/* ---------------------------------------------------------------------- */
function initMaterialTabs(){
  const tabs = document.querySelectorAll('.mtab');
  const images = document.querySelectorAll('.material-media img');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.material;
      images.forEach(img => img.classList.toggle('active', img.dataset.material === target));
    });
  });
}

/* ---------------------------------------------------------------------- */
/* FAQ ACCORDION                                                           */
/* ---------------------------------------------------------------------- */
function initFAQ(){
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
}

/* ---------------------------------------------------------------------- */
/* TESTIMONIAL SLIDER                                                      */
/* ---------------------------------------------------------------------- */
function initTestimonials(){
  const slides = document.querySelectorAll('.t-slide');
  const dots = document.querySelectorAll('.t-dot');
  if(!slides.length) return;
  let idx = 0;
  function show(i){
    slides.forEach((s,n)=> s.classList.toggle('active', n===i));
    dots.forEach((d,n)=> d.classList.toggle('active', n===i));
    idx = i;
  }
  dots.forEach((d,n)=> d.addEventListener('click', ()=> show(n)));
  setInterval(() => show((idx+1) % slides.length), 5500);
}

/* ---------------------------------------------------------------------- */
/* NEWSLETTER                                                              */
/* ---------------------------------------------------------------------- */
function initNewsletter(){
  const form = document.getElementById('nlForm');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('nlSuccess').style.display = 'block';
    form.reset();
  });
}

/* ---------------------------------------------------------------------- */
/* SCROLL REVEAL                                                           */
/* ---------------------------------------------------------------------- */
function initReveal(){
  const targets = document.querySelectorAll('.reveal-on-scroll');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => io.observe(t));
}

/* ---------------------------------------------------------------------- */
/* CTA PARALLAX (subtle, transform-based)                                  */
/* ---------------------------------------------------------------------- */
function initParallax(){
  const media = document.querySelectorAll('.cta-band img, .hero-media img');
  if(!media.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    document.querySelectorAll('.cta-band').forEach(band => {
      const img = band.querySelector('img');
      const rect = band.getBoundingClientRect();
      if(rect.bottom > 0 && rect.top < window.innerHeight){
        img.style.transform = `translateY(${(rect.top) * -0.08}px)`;
      }
    });
  }, { passive:true });
}

/* ---------------------------------------------------------------------- */
/* INIT                                                                    */
/* ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  initFilters();
  initNav();
  initMaterialTabs();
  initFAQ();
  initTestimonials();
  initNewsletter();
  initReveal();
  initParallax();
  renderCart();

  requestAnimationFrame(() => {
    document.querySelector('.hero')?.classList.add('loaded');
  });
});
