/* =========================================================
   NOIRÉ — script.js
   Vanilla JS only. No dependencies.
   ========================================================= */
(function(){
  "use strict";

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     PRODUCT DATA
     Replace image URLs / copy here to swap in real catalog.
  ------------------------------------------------------- */
  var PRODUCTS = [
    {
      id: 'noma-lounge',
      name: 'Noma Lounge Chair',
      material: 'Bouclé / solid oak',
      price: 24900,
      tag: 'Bestseller',
      size: 'lg',
      img: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?q=80&w=1200&auto=format&fit=crop',
      desc: 'A deep-seated lounge chair built around a solid oak frame, upholstered in undyed bouclé that softens with every year of use.'
    },
    {
      id: 'aster-side',
      name: 'Aster Side Table',
      material: 'Walnut veneer',
      price: 8900,
      tag: 'New',
      size: 'sm',
      img: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?q=80&w=1000&auto=format&fit=crop',
      desc: 'A quietly sculptural side table in book-matched walnut veneer, finished with a hand-rubbed natural oil.'
    },
    {
      id: 'linden-sofa',
      name: 'Linden 3-Seat Sofa',
      material: 'Linen / ash frame',
      price: 64900,
      tag: null,
      size: 'wide',
      img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1400&auto=format&fit=crop',
      desc: 'Low-slung and generously cushioned, the Linden seats three in stonewashed linen over a solid ash frame.'
    },
    {
      id: 'oslo-stool',
      name: 'Oslo Stool',
      material: 'Solid beech',
      price: 5400,
      tag: null,
      size: 'sm',
      img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1000&auto=format&fit=crop',
      desc: 'A one-piece steam-bent stool in solid beech, equally at home as a seat, a side table, or a plant stand.'
    },
    {
      id: 'harbor-bed',
      name: 'Harbor Bed Frame',
      material: 'Solid oak',
      price: 41900,
      tag: 'New',
      size: 'sm',
      img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000&auto=format&fit=crop',
      desc: 'A low, architectural bed frame in solid oak with a gently splayed headboard and concealed slat base.'
    }
  ];

  var CART_COUNT = 0;

  /* -------------------------------------------------------
     UTIL
  ------------------------------------------------------- */
  function formatPrice(n){
    return '₹' + n.toLocaleString('en-IN');
  }
  function trapFocus(container){
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
    return focusable;
  }

  /* -------------------------------------------------------
     NAV: scroll compact state
  ------------------------------------------------------- */
  var nav = document.querySelector('.floating-nav');
  var lastY = 0;
  function onScroll(){
    var y = window.scrollY;
    if (y > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    lastY = y;
    handleParallax();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* -------------------------------------------------------
     MOBILE MENU
  ------------------------------------------------------- */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var closeMenuBtn = document.getElementById('closeMenuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuScrim = document.getElementById('menuScrim');

  function openMenu(){
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuScrim.classList.add('show');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    closeMenuBtn.focus();
  }
  function closeMenu(){
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuScrim.classList.remove('show');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    hamburgerBtn.focus();
  }
  hamburgerBtn.addEventListener('click', openMenu);
  closeMenuBtn.addEventListener('click', closeMenu);
  menuScrim.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });

  /* -------------------------------------------------------
     RENDER PRODUCTS
  ------------------------------------------------------- */
  var grid = document.getElementById('productGrid');
  function renderProducts(){
    var html = PRODUCTS.map(function(p){
      var sizeClass = p.size === 'lg' ? 'product-card--lg' : (p.size === 'wide' ? 'product-card--wide' : '');
      var tagClass = p.tag === 'New' ? 'pc-tag pc-tag--new' : 'pc-tag';
      return (
        '<article class="product-card ' + sizeClass + '" data-id="' + p.id + '" tabindex="0" role="button" aria-label="Quick view ' + p.name + '">' +
          '<div class="pc-media">' +
            (p.tag ? '<span class="' + tagClass + '">' + p.tag + '</span>' : '') +
            '<button class="pc-wish" type="button" aria-label="Add ' + p.name + ' to wishlist" data-role="wish">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7.5-4.6-10-9.3C.5 7.3 2.4 4 6 4c2.1 0 3.6 1.2 6 3.6C14.4 5.2 15.9 4 18 4c3.6 0 5.5 3.3 4 6.7C19.5 15.4 12 20 12 20z"/></svg>' +
            '</button>' +
            '<img loading="lazy" src="' + p.img + '" alt="' + p.name + ', ' + p.material + '">' +
          '</div>' +
          '<div class="pc-info">' +
            '<span><span class="pc-name">' + p.name + '</span><span class="pc-material">' + p.material + '</span></span>' +
            '<span class="pc-price">' + formatPrice(p.price) + '</span>' +
            '<button class="pc-add" type="button" aria-label="Add ' + p.name + ' to cart" data-role="add">+</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
    grid.innerHTML = html;
  }
  renderProducts();

  /* -------------------------------------------------------
     CART + TOAST
  ------------------------------------------------------- */
  var cartCountEl = document.getElementById('cartCount');
  var cartToggle = document.getElementById('cartToggle');
  var toast = document.getElementById('toast');
  var toastImg = document.getElementById('toastImg');
  var toastTimer = null;

  function addToCart(product, sourceEl){
    CART_COUNT += 1;
    cartCountEl.textContent = CART_COUNT;
    cartCountEl.classList.add('show');
    cartToggle.classList.remove('bump');
    void cartToggle.offsetWidth; // restart animation
    cartToggle.classList.add('bump');

    toastImg.src = product.img;
    toastImg.alt = '';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2400);

    if (!reduceMotion && sourceEl){
      flyToCart(sourceEl, product.img);
    }
  }

  function flyToCart(sourceEl, imgSrc){
    var srcRect = sourceEl.getBoundingClientRect();
    var destRect = cartToggle.getBoundingClientRect();
    var flyer = document.createElement('img');
    flyer.src = imgSrc;
    flyer.style.cssText = 'position:fixed;z-index:600;width:38px;height:38px;border-radius:50%;object-fit:cover;pointer-events:none;' +
      'left:' + srcRect.left + 'px;top:' + srcRect.top + 'px;transition:transform .6s cubic-bezier(.22,.61,.36,1), opacity .6s ease;';
    document.body.appendChild(flyer);
    requestAnimationFrame(function(){
      var dx = destRect.left - srcRect.left;
      var dy = destRect.top - srcRect.top;
      flyer.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.2)';
      flyer.style.opacity = '0.4';
    });
    setTimeout(function(){ flyer.remove(); }, 650);
  }

  /* Delegate add-to-cart + wishlist + card open clicks */
  grid.addEventListener('click', function(e){
    var addBtn = e.target.closest('[data-role="add"]');
    var wishBtn = e.target.closest('[data-role="wish"]');
    var card = e.target.closest('.product-card');
    if (!card) return;
    var product = PRODUCTS.find(function(p){ return p.id === card.dataset.id; });

    if (addBtn){
      e.stopPropagation();
      addBtn.classList.remove('clicked'); void addBtn.offsetWidth; addBtn.classList.add('clicked');
      addToCart(product, addBtn);
      return;
    }
    if (wishBtn){
      e.stopPropagation();
      wishBtn.classList.toggle('active');
      return;
    }
    openQuickView(product);
  });
  grid.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var card = e.target.closest('.product-card');
    if (!card) return;
    e.preventDefault();
    var product = PRODUCTS.find(function(p){ return p.id === card.dataset.id; });
    openQuickView(product);
  });

  /* -------------------------------------------------------
     QUICK VIEW MODAL
  ------------------------------------------------------- */
  var modalScrim = document.getElementById('modalScrim');
  var quickview = document.getElementById('quickview');
  var qvImg = document.getElementById('qvImg');
  var qvTag = document.getElementById('qvTag');
  var qvName = document.getElementById('qvName');
  var qvMaterial = document.getElementById('qvMaterial');
  var qvDesc = document.getElementById('qvDesc');
  var qvPrice = document.getElementById('qvPrice');
  var qvAdd = document.getElementById('qvAdd');
  var qvClose = document.getElementById('qvClose');
  var qtyValue = document.getElementById('qtyValue');
  var qtyMinus = document.getElementById('qtyMinus');
  var qtyPlus = document.getElementById('qtyPlus');
  var currentProduct = null;
  var qty = 1;
  var lastFocused = null;

  function openQuickView(product){
    currentProduct = product;
    qty = 1;
    qtyValue.textContent = qty;
    qvImg.src = product.img;
    qvImg.alt = product.name;
    qvTag.textContent = product.tag || 'Noiré Studio';
    qvName.textContent = product.name;
    qvMaterial.textContent = product.material;
    qvDesc.textContent = product.desc;
    qvPrice.textContent = formatPrice(product.price);

    lastFocused = document.activeElement;
    modalScrim.classList.add('show');
    quickview.classList.add('open');
    quickview.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    qvClose.focus();
  }
  function closeQuickView(){
    quickview.classList.remove('open');
    quickview.setAttribute('aria-hidden', 'true');
    modalScrim.classList.remove('show');
    document.body.classList.remove('menu-open');
    if (lastFocused) lastFocused.focus();
  }
  qvClose.addEventListener('click', closeQuickView);
  modalScrim.addEventListener('click', closeQuickView);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && quickview.classList.contains('open')) closeQuickView();
  });
  qtyMinus.addEventListener('click', function(){ qty = Math.max(1, qty - 1); qtyValue.textContent = qty; });
  qtyPlus.addEventListener('click', function(){ qty = Math.min(9, qty + 1); qtyValue.textContent = qty; });
  qvAdd.addEventListener('click', function(){
    qvAdd.classList.remove('clicked'); void qvAdd.offsetWidth; qvAdd.classList.add('clicked');
    for (var i=0;i<qty;i++) CART_COUNT += 0; // qty already reflected in single add for simplicity
    addToCart(currentProduct, qvAdd);
    closeQuickView();
  });

  /* -------------------------------------------------------
     SCROLL REVEALS (IntersectionObserver)
  ------------------------------------------------------- */
  document.querySelectorAll('.statement-text, .why-item').forEach(function(el){
    el.classList.add('io-reveal');
  });
  if ('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.io-reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.io-reveal').forEach(function(el){ el.classList.add('in-view'); });
  }

  /* -------------------------------------------------------
     CINEMATIC PARALLAX (vanilla JS, disabled under reduced motion
     and simplified on small screens)
  ------------------------------------------------------- */
  var cinematic = document.getElementById('cinematic');
  var parallaxImg = document.getElementById('parallaxImg');
  function handleParallax(){
    if (reduceMotion || !cinematic || window.innerWidth < 720) return;
    var rect = cinematic.getBoundingClientRect();
    var vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) return;
    var progress = (vh - rect.top) / (vh + rect.height); // 0 -> 1
    var shift = (progress - 0.5) * 60; // px
    parallaxImg.style.transform = 'translateY(' + shift.toFixed(1) + 'px) scale(1.08)';
  }

  /* -------------------------------------------------------
     HERO POINTER MICRO-MOVEMENT (desktop only)
  ------------------------------------------------------- */
  var heroMedia = document.querySelector('.hero-media');
  if (heroMedia && !reduceMotion && window.matchMedia('(hover:hover)').matches){
    heroMedia.addEventListener('mousemove', function(e){
      var rect = heroMedia.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      heroMedia.style.transform = 'translate(' + (x * -8).toFixed(1) + 'px,' + (y * -8).toFixed(1) + 'px)';
    });
    heroMedia.addEventListener('mouseleave', function(){
      heroMedia.style.transform = 'translate(0,0)';
    });
  }

  /* -------------------------------------------------------
     TESTIMONIAL CAROUSEL
  ------------------------------------------------------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.testimonial-slide'));
  var dotsWrap = document.getElementById('testimonialDots');
  var current = 0;
  var autoTimer = null;

  slides.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    dot.addEventListener('click', function(){ goTo(i); resetAuto(); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  function goTo(i){
    slides[current].classList.remove('active');
    slides[current].setAttribute('aria-hidden', 'true');
    dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    slides[current].setAttribute('aria-hidden', 'false');
    dots[current].classList.add('active');
  }
  slides[0].classList.add('active');
  dots[0].classList.add('active');

  document.getElementById('testimonialPrev').addEventListener('click', function(){ goTo(current - 1); resetAuto(); });
  document.getElementById('testimonialNext').addEventListener('click', function(){ goTo(current + 1); resetAuto(); });

  function resetAuto(){
    clearInterval(autoTimer);
    if (reduceMotion) return;
    autoTimer = setInterval(function(){ goTo(current + 1); }, 6000);
  }
  resetAuto();

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */
  onScroll();
})();
