'use strict';
/* ================= CONFIG ================= */
const CONFIG={
  /* Paste your deployed Google Apps Script web-app URL here (see Code.gs). Leave '' to use the demo products below. */
  SHEET_API_URL:'https://script.google.com/macros/s/AKfycbxmKGi8uX5raJzIzdiAPQyfQ6J89TJjFHE9Mz_AjCUL8Gg-iX3VcLU2LJ8e9A4-0pIM/exec',
  BRAND:'Marsuki',FREE_SHIP_ABOVE:999,SHIPPING:60,
  UPI_ID:'yourname@upi',EMAIL:'hello@example.com',PHONE:'+91 00000 00000',WHATSAPP:'910000000000',ADDRESS:'Alappuzha, Kerala, India'};
/* Demo products, used only when SHEET_API_URL is empty or fails. Sheet columns: id, name, price, mrp, image, category, description, Recommended */
const U=id=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;
const DEMO=[
['Ashwagandha Root Capsules',549,699,'photo-1471193945509-9ad0617afabf','Wellness','Whole-root ashwagandha in easy capsules.','yes'],
['Tulsi Ginger Herbal Tea',299,0,'photo-1544787219-7f47ccb76574','Teas','Holy basil, ginger and cardamom, blended in small batches.','yes'],
['Kumkumadi Face Oil',1299,1599,'photo-1608571423902-eed4a5ad8108','Skin & Hair','Saffron and sandalwood in a light facial oil.','yes'],
['Triphala Churna',249,0,'photo-1515023115689-589c33041d3c','Wellness','Amalaki, bibhitaki and haritaki, stone-ground.',''],
['Classic Chyawanprash',449,520,'photo-1505576399279-565b52d4ac71','Wellness','Amla-based herbal jam made to the classical recipe.','yes'],
['Bhringraj Hair Oil',379,0,'photo-1526947425960-945c6e72858f','Skin & Hair','Slow-infused bhringraj and coconut oil.',''],
['Neem & Turmeric Soap',159,0,'photo-1600857062241-98e5dba7f214','Skin & Hair','Cold-process bar with neem and turmeric.',''],
['Sesame Abhyanga Oil',699,849,'photo-1590779033100-9f60a05a013d','Oils','Herb-infused sesame oil for daily self-massage.','']
].map(r=>({id:r[0],name:r[0],price:r[1],mrp:r[2],image:U(r[3]),category:r[4],description:r[5],Recommended:r[6]}));
DEMO[1].availableSizes='25 bags, 50 bags';
const HERO=U('photo-1515377905703-c4788e51af15'),HERO2=U('photo-1556228720-195a672e8a03');

/* ================= HELPERS ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const inr=n=>'₹'+(+n||0).toLocaleString('en-IN');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const getCart=()=>read('cart',[]).map(i=>({...i,key:i.key||i.id,qty:i.qty||1})),getWish=()=>read('wishlist',[]);
const PAGE=document.body.dataset.page||'';
const REG={};  /* id -> product, so buttons only need the id */
function norm(r){const price=+String(r.price??0).replace(/[^\d.]/g,'')||0,mrp=+String(r.mrp??r.was??0).replace(/[^\d.]/g,'')||0;
  const list=v=>String(v??'').split(/[\n|,]/).map(x=>x.trim()).filter(Boolean);
  const rec=String(r.Recommended??r.recommended??'').toLowerCase().trim(),image=String(r.image||'').trim();
  const p={id:String(r.id||r.name),name:String(r.name||'Untitled'),price,mrp:mrp>price?mrp:0,image,images:[...new Set([image,...list(r.images)].filter(Boolean))],sizes:list(r.availableSizes),category:String(r.category||'Other').trim(),description:r.description||'',recommended:['yes','true','✅','y','1'].includes(rec)};
  REG[p.id]=p;return p}

function toast(m){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent=m;requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)}

/* ================= HEADER / MENU / FOOTER (injected on every page) ================= */
const LINKS=[['index.html','Home','fa-house','home'],['index.html#shop','Shop','fa-store','shop'],['about.html','About','fa-seedling','about'],['contact.html','Contact','fa-envelope','contact']];
function chrome(){
  const cur=p=>PAGE===p?' aria-current="page"':'';
  const dl=LINKS.map(l=>`<a href="${l[0]}"${cur(l[3])}>${l[1]}</a>`).join('');
  const ml=LINKS.concat([['wishlist.html','Wishlist','fa-heart','wishlist'],['cart.html','Cart','fa-basket-shopping','cart']]).map(l=>`<a class="ml" href="${l[0]}"${cur(l[3])}><i class="fa-solid ${l[2]}"></i>${l[1]}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin',`<div class="strip">Herbs sourced with care, prepared the traditional way.</div>
<header class="hdr" id="hdr"><div class="wrap hdr-in">
<button class="ib menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mnav"><i class="fa-solid fa-bars"></i></button>
<a class="logo" href="index.html" aria-label="${CONFIG.BRAND} home"><i class="fa-solid fa-leaf"></i><span>${CONFIG.BRAND}</span></a>
<nav class="dnav" aria-label="Main">${dl}</nav>
<div class="acts"><button class="ib" id="searchBtn" type="button" aria-label="Search products" aria-expanded="false" aria-controls="sbar"><i class="fa-solid fa-magnifying-glass"></i></button>
<a class="ib" href="wishlist.html" aria-label="Wishlist"><i class="fa-solid fa-heart"></i><b data-wc></b></a>
<a class="ib" href="cart.html" aria-label="Cart"><i class="fa-solid fa-basket-shopping"></i><b data-cc></b></a></div></div>
<div class="sbar" id="sbar" hidden><div class="wrap"><form id="sform" role="search"><label class="sr" for="q">Search products</label><input id="q" type="search" placeholder="Search herbs, oils, teas" autocomplete="off"><button class="btn" type="submit">Search</button></form></div></div></header>
<div class="scrim" id="scrim" hidden></div>
<aside class="mnav" id="mnav" aria-label="Menu"><div class="mnav-h"><a class="logo" href="index.html"><i class="fa-solid fa-leaf"></i>${CONFIG.BRAND}</a><button class="ib" id="menuClose" type="button" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button></div>${ml}<div class="mnav-f"><p>${esc(CONFIG.EMAIL)}<br>${esc(CONFIG.PHONE)}</p></div></aside>`);
  document.body.insertAdjacentHTML('beforeend',`<footer class="foot"><div class="wrap fgrid">
<div><a class="logo" href="index.html"><i class="fa-solid fa-leaf"></i>${CONFIG.BRAND}</a><p>Ayurvedic herbs, oils and rituals for everyday balance.</p></div>
<div><h4>Shop</h4><a href="index.html#shop">All products</a><a href="wishlist.html">Wishlist</a><a href="cart.html">Cart</a></div>
<div><h4>Company</h4><a href="about.html">About us</a><a href="contact.html">Contact us</a><a href="index.html">Home</a></div>
<div><h4>Reach us</h4><a href="mailto:${esc(CONFIG.EMAIL)}">${esc(CONFIG.EMAIL)}</a><a href="tel:${esc(CONFIG.PHONE.replace(/\s/g,''))}">${esc(CONFIG.PHONE)}</a><p>${esc(CONFIG.ADDRESS)}</p></div></div>
<p class="wrap copy">© ${new Date().getFullYear()} ${CONFIG.BRAND}. Traditional wellness products; not intended to diagnose, treat or cure any disease. <a class="adm" href="admin.html" aria-label="Admin sign in"><i class="fa-solid fa-lock"></i></a></p></footer>`);
  menuInit();searchInit();badges();
}
/* Mobile menu: lives OUTSIDE <header>, because a fixed element inside a backdrop-filter parent is positioned against that parent, not the screen. */
function menuInit(){const m=$('#mnav'),b=$('#menuBtn'),s=$('#scrim');let last;
  const open=()=>{last=document.activeElement;m.classList.add('open');s.hidden=false;document.documentElement.classList.add('lock');b.setAttribute('aria-expanded','true');$('#menuClose').focus()};
  const close=()=>{m.classList.remove('open');s.hidden=true;document.documentElement.classList.remove('lock');b.setAttribute('aria-expanded','false');last&&last.focus&&last.focus()};
  b.addEventListener('click',open);$('#menuClose').addEventListener('click',close);s.addEventListener('click',close);
  m.addEventListener('click',e=>{if(e.target.closest('a'))close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('open'))close()});
  matchMedia('(min-width:861px)').addEventListener('change',e=>{if(e.matches&&m.classList.contains('open'))close()})}
function searchInit(){const btn=$('#searchBtn'),bar=$('#sbar'),q=$('#q');
  const set=o=>{bar.hidden=!o;btn.setAttribute('aria-expanded',o);if(o)q.focus()};
  btn.addEventListener('click',()=>set(bar.hidden));
  $('#sform').addEventListener('submit',e=>{e.preventDefault();if(PAGE==='home'){applyQuery(q.value);$('#shop').scrollIntoView()}else location.href='index.html?q='+encodeURIComponent(q.value.trim())+'#shop'});
  q.addEventListener('input',()=>{if(PAGE==='home')applyQuery(q.value)});
  const init=new URLSearchParams(location.search).get('q');if(init&&PAGE==='home'){q.value=init;set(true)}}
function badges(){const n=getCart().reduce((s,i)=>s+(i.qty||1),0),w=getWish().length;
  $$('[data-cc]').forEach(b=>{b.textContent=n||'';b.dataset.n=n});$$('[data-wc]').forEach(b=>{b.textContent=w||'';b.dataset.n=w})}

/* ================= DATA (Google Sheet via Apps Script) ================= */
async function loadProducts(){
  let rows=null;
  if(CONFIG.SHEET_API_URL){try{const r=await fetch(CONFIG.SHEET_API_URL);const d=await r.json();if(Array.isArray(d)&&d.length)rows=d}catch(e){console.error('Sheet load failed, using demo data',e)}}
  const list=(rows||DEMO).map(norm);write('lastCount',list.length);return list}

/* ================= CARDS ================= */
function card(p){const off=p.mrp?Math.round(100-p.price/p.mrp*100):0,w=getWish().some(x=>x.id===p.id);const id=esc(p.id);
  return `<article class="card"><div class="pimgw"><div class="pimg" data-view="${id}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.classList.add('bad')"></div>${p.recommended?'<span class="tag">Recommended</span>':''}<button class="ib wish" type="button" data-wish="${id}" aria-pressed="${w}" aria-label="${w?'Remove':'Add'} ${esc(p.name)} ${w?'from':'to'} wishlist"><i class="fa-solid fa-heart"></i></button></div>
<span class="cat-l">${esc(p.category)}</span><h3 data-view="${id}">${esc(p.name)}</h3>
<div class="price">${inr(p.price)}${p.mrp?`<s>${inr(p.mrp)}</s> <small>${off}% off</small>`:''}</div>
<div class="crow"><button class="btn" type="button" data-add="${id}"><i class="fa-solid fa-cart-plus"></i>${p.sizes.length?'Select size':'Add to cart'}</button></div></article>`}
const skeletons=n=>Array.from({length:n},()=>'<div class="skel" aria-hidden="true"></div>').join('');

/* ================= CART / WISHLIST ACTIONS ================= */
function addToCart(p,n=1,size=''){const c=getCart(),key=p.id+(size?'|'+size:''),i=c.find(x=>x.key===key);if(i)i.qty=Math.min(10,i.qty+n);else c.push({key,id:p.id,name:p.name,price:p.price,image:p.image,size,qty:n});write('cart',c);badges();toast(`${p.name}${size?' ('+size+')':''} added to cart`)}
function toggleWish(p){let w=getWish();const has=w.some(x=>x.id===p.id);w=has?w.filter(x=>x.id!==p.id):[...w,{...p}];write('wishlist',w);badges();toast(has?'Removed from wishlist':'Saved to wishlist')}
function setQty(key,d){let c=getCart();const i=c.find(x=>x.key===key);if(!i)return;i.qty=Math.min(10,i.qty+d);if(i.qty<1)c=c.filter(x=>x!==i);write('cart',c);badges();renderCart()}

/* ---- Description parser: turns messy sheet text (chat stamps, emoji lines, 1./* lists) into {intro:[...],feats:[{t,d}]} ---- */
const PIC='[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B50}\\u{2B55}\\u{231A}-\\u{23FF}]',
  STAMP=/\[\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?,?\s*\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}\]\s*(?:\+?\d[\d\s().-]{6,}\d)?\s*:?/gi;
function parseDesc(raw){
  const split=new RegExp('(?='+PIC+')','u'),lead=new RegExp('^(?:'+PIC+'|\\s)+','u'),isPic=new RegExp('^'+PIC,'u'),NUM=/^\d{1,2}[.)]\s+/,BUL=/^[*•\-–—·▪●]\s+/;
  const t=String(raw||'').replace(STAMP,'\n').replace(/[️‍]/g,'');
  const intro=[],feats=[];let open=null;
  const mk=s=>{const i=s.indexOf(':');if(i>0&&i<=45)return{t:s.slice(0,i).trim(),d:s.slice(i+1).trim()};return s.length>45?{t:'',d:s}:{t:s,d:''}};
  t.split(/\r?\n/).forEach(line=>line.split(split).forEach(seg=>{
    seg=seg.trim();if(!seg)return;
    const pic=isPic.test(seg),num=NUM.test(seg.replace(lead,'')),bul=BUL.test(seg);
    const c=seg.replace(lead,'').replace(NUM,'').replace(BUL,'').trim();if(!c)return;
    if(pic||num){const f=mk(c);feats.push(f);open=f.t&&!f.d?f:null}
    else if(bul){if(open)open.d=(open.d?open.d+' · ':'')+c;else{feats.push(mk(c))}}
    else if(intro.length&&c.length<=48&&!/[.!?:]$/.test(c)){feats.push({t:c,d:''});open=null}
    else intro.push(c)}));
  return{intro,feats}}
function fmtDesc(raw){
  const {intro,feats}=parseDesc(raw);
  if(!intro.length&&!feats.length)return{html:'<p class="lede">Traditional herbal product.</p>',long:false};
  const fh=feats.map(f=>`<li><i class="fa-solid fa-leaf"></i><div>${f.t&&f.d?`<b>${esc(f.t)}</b><span>${esc(f.d)}</span>`:`<span style="color:var(--ink)">${esc(f.t||f.d)}</span>`}</div></li>`).join('');
  const html=intro.map((x,i)=>`<p${i?'':' class="lede"'}>${esc(x)}</p>`).join('')+(fh?`<ul class="mfeat">${fh}</ul>`:'');
  return{html,long:(intro.join(' ').length+feats.map(f=>f.t+f.d).join(' ').length)>380}}

function quick(p){let m=$('#modal');if(!m){m=document.createElement('div');m.id='modal';m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby','mT');document.body.appendChild(m)}
  const last=document.activeElement,off=p.mrp?Math.round(100-p.price/p.mrp*100):0,imgs=p.images.length?p.images:[''],d=fmtDesc(p.description),inWish=()=>getWish().some(x=>x.id===p.id);
  let size=p.sizes[0]||'',qty=1;
  m.innerHTML=`<div class="mbox"><div class="xw"><button class="ib x" type="button" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div><div class="grab" aria-hidden="true"><span></span></div>
<div class="mgal"><div class="mmain" id="mMain"><img src="${esc(imgs[0])}" alt="${esc(p.name)}" onerror="this.classList.add('bad')">${off?`<span class="mbadge">${off}% off</span>`:''}<button class="ib mwish" id="mWish" type="button" aria-pressed="${inWish()}" aria-label="Save to wishlist"><i class="fa-solid fa-heart"></i></button></div>${imgs.length>1?`<div class="thumbs">${imgs.map((u,i)=>`<button type="button" class="th" data-u="${esc(u)}" aria-pressed="${i===0}" aria-label="Show image ${i+1}"><img src="${esc(u)}" alt="" onerror="this.classList.add('bad')"></button>`).join('')}</div>`:''}</div>
<div class="minfo"><div class="mscroll"><span class="mcat">${esc(p.category)}</span><h2 id="mT">${esc(p.name)}</h2>
<div class="mprice"><b>${inr(p.price)}</b>${p.mrp?`<s>${inr(p.mrp)}</s><small>${off}% off</small>`:''}</div>
<div class="mdesc${d.long?' clip':''}" id="mDesc">${d.html}</div>${d.long?'<button class="more" type="button" id="mMore" aria-expanded="false">Read more<i class="fa-solid fa-chevron-down"></i></button>':''}
${p.sizes.length?`<p class="mlabel">Choose size</p><div class="sizes" role="group" aria-label="Size">${p.sizes.map((z,i)=>`<button type="button" class="chip" data-size="${esc(z)}" aria-pressed="${i===0}">${esc(z)}</button>`).join('')}</div>`:''}
<div class="mperks"><div><i class="fa-solid fa-truck-fast"></i>Free delivery above ${inr(CONFIG.FREE_SHIP_ABOVE)}</div><div><i class="fa-solid fa-mortar-pestle"></i>Traditional methods</div><div><i class="fa-solid fa-box-open"></i>Plastic-light packing</div></div>
<a class="mask" target="_blank" rel="noopener" href="https://wa.me/${esc(CONFIG.WHATSAPP)}?text=${encodeURIComponent('Hello, I have a question about '+p.name)}"><i class="fa-brands fa-whatsapp"></i>Have a question? Ask us on WhatsApp</a></div>
<div class="mfoot"><div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease quantity">−</button><span id="mQty" aria-live="polite">1</span><button type="button" data-q="1" aria-label="Increase quantity">+</button></div><button class="btn" type="button" id="mAdd"><i class="fa-solid fa-cart-plus"></i><span id="mAddT"></span></button></div></div></div>`;
  const sync=()=>{$('#mQty',m).textContent=qty;$('#mAddT',m).textContent='Add to cart · '+inr(p.price*qty)};sync();
  m.hidden=false;m.scrollTop=0;document.documentElement.classList.add('lock');
  const close=()=>{m.hidden=true;document.documentElement.classList.remove('lock');document.removeEventListener('keydown',esc_);last&&last.focus&&last.focus()},esc_=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',esc_);
  m.onclick=e=>{if(e.target===m||e.target.closest('.x'))return close();
    const th=e.target.closest('.th');if(th){const im=$('#mMain img',m);im.src=th.dataset.u;im.classList.remove('bad');$$('.th',m).forEach(b=>b.setAttribute('aria-pressed',b===th))}
    const z=e.target.closest('[data-size]');if(z){size=z.dataset.size;$$('[data-size]',m).forEach(b=>b.setAttribute('aria-pressed',b===z))}
    const q=e.target.closest('[data-q]');if(q){qty=Math.max(1,Math.min(10,qty+ +q.dataset.q));sync()}
    if(e.target.closest('#mMore')){const b=$('#mMore',m),c=$('#mDesc',m).classList.toggle('clip');b.setAttribute('aria-expanded',!c);b.firstChild.textContent=c?'Read more':'Show less';b.classList.toggle('open',!c)}};
  /* swipe the handle down to dismiss (mobile sheet) */
  const g=$('.grab',m),bx=$('.mbox',m);let y0=0,dy=0;
  g.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;dy=0;bx.style.transition='none'},{passive:true});
  g.addEventListener('touchmove',e=>{dy=Math.max(0,e.touches[0].clientY-y0);bx.style.transform=`translateY(${dy}px)`},{passive:true});
  g.addEventListener('touchend',()=>{bx.style.transition='';bx.style.transform='';if(dy>90)close()});
  $('#mAdd',m).onclick=()=>{addToCart(p,qty,size);close()};
  $('#mWish',m).onclick=()=>{toggleWish(p);$('#mWish',m).setAttribute('aria-pressed',inWish());refresh()};$('.x',m).focus()}

/* One click handler for every page */
document.addEventListener('click',e=>{const t=e.target.closest('[data-add],[data-wish],[data-view],[data-inc],[data-dec],[data-rm],[data-cat]');if(!t)return;const d=t.dataset;
  if(d.add){const p=REG[d.add];p.sizes.length?quick(p):addToCart(p)}
  else if(d.wish){toggleWish(REG[d.wish]||getWish().find(x=>x.id===d.wish));refresh()}
  else if(d.view)quick(REG[d.view]);
  else if(d.inc)setQty(d.inc,1);else if(d.dec)setQty(d.dec,-1);
  else if(d.rm){write('cart',getCart().filter(x=>x.key!==d.rm));badges();renderCart()}
  else if(d.cat!==undefined){state.cat=d.cat;renderShop()}});
function refresh(){if(PAGE==='home')renderShop(true);else if(PAGE==='wishlist')renderWish()}

/* ================= HOME: recommended + all products + filters + search ================= */
const state={cat:'',q:''};let ALL=[];
function applyQuery(v){state.q=v;renderShop()}
function renderShop(keepScroll){
  const rec=$('#recProducts');if(!rec)return;
  const r=ALL.filter(p=>p.recommended);$('#recSection').hidden=!r.length;rec.innerHTML=r.map(card).join('');
  const cats=[...new Set(ALL.map(p=>p.category))];
  $('#filters').innerHTML=['',...cats].map(c=>`<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c===state.cat}">${c?esc(c):'All'} (${c?ALL.filter(p=>p.category===c).length:ALL.length})</button>`).join('');
  const q=state.q.trim().toLowerCase(),l=ALL.filter(p=>(!state.cat||p.category===state.cat)&&(!q||[p.name,p.category,p.description].some(s=>s.toLowerCase().includes(q))));
  $('#allProducts').innerHTML=l.length?l.map(card).join(''):`<div class="empty"><h3>No products found</h3><p>Try a different search or choose another category.</p><button class="btn" type="button" data-cat="">Show all products</button></div>`;
  $('#status').textContent=`${l.length} product${l.length===1?'':'s'}`+(q?` for “${state.q.trim()}”`:'')}
async function initHome(){
  $('#recProducts').innerHTML=skeletons(3);$('#allProducts').innerHTML=skeletons(Math.min(8,read('lastCount',4)));
  $('#heroImg').style.setProperty('--img',`url(${HERO})`);$('#heroImg2').style.setProperty('--img',`url(${HERO2})`);
  ALL=await loadProducts();renderShop();
  if(!ALL.length)$('#allProducts').innerHTML='<div class="empty"><h3>No products yet</h3><p>Check back soon.</p></div>'}

/* ================= CART PAGE ================= */
function renderCart(){const box=$('#cartLines');if(!box)return;const c=getCart();
  if(!c.length){box.innerHTML='<div class="empty"><h3>Your cart is empty</h3><p>Browse the herbal shelf and add what you need.</p><a class="btn" href="index.html#shop">Continue shopping</a></div>';$('#sum').hidden=true;return}
  $('#sum').hidden=false;let sub=0;
  box.innerHTML='<div class="lines">'+c.map(i=>{const t=i.price*i.qty;sub+=t;return `<div class="line"><div class="pimg"><img src="${esc(i.image)}" alt="${esc(i.name)}" onerror="this.classList.add('bad')"></div><div><h3>${esc(i.name)}${i.size?` <small style="font:400 .85rem var(--bf);color:var(--mute)">(${esc(i.size)})</small>`:''}</h3><span class="price" style="padding:0;font-size:1rem">${inr(i.price)}</span><br><div class="qty"><button type="button" data-dec="${esc(i.key)}" aria-label="Decrease quantity of ${esc(i.name)}">−</button><span>${i.qty}</span><button type="button" data-inc="${esc(i.key)}" aria-label="Increase quantity of ${esc(i.name)}">+</button><button class="rm" type="button" data-rm="${esc(i.key)}">Remove</button></div></div><div class="sub">${inr(t)}</div></div>`}).join('')+'</div>';
  const ship=sub>=CONFIG.FREE_SHIP_ABOVE?0:CONFIG.SHIPPING,left=CONFIG.FREE_SHIP_ABOVE-sub;
  $('#sSub').textContent=inr(sub);$('#sShip').textContent=ship?inr(ship):'Free';$('#sTot').textContent=inr(sub+ship);
  $('#sTip').textContent=left>0?`Add ${inr(left)} more for free delivery.`:'You’ve unlocked free delivery.'}
/* ================= WISHLIST PAGE ================= */
function renderWish(){const g=$('#wishGrid');if(!g)return;const w=getWish();w.forEach(p=>REG[p.id]=p);
  g.innerHTML=w.length?w.map(card).join(''):'<div class="empty"><h3>Your wishlist is empty</h3><p>Tap the heart on any product to save it here.</p><a class="btn" href="index.html#shop">Browse products</a></div>';
  $('#wishNote').textContent=w.length?`${w.length} saved item${w.length===1?'':'s'}`:''}
/* ================= CONTACT PAGE (no backend needed: opens WhatsApp or email with the message filled in) ================= */
function initContact(){const f=$('#cform');if(!f)return;let mode='wa';
  $$('button[data-send]',f).forEach(b=>b.addEventListener('click',()=>mode=b.dataset.send));
  f.addEventListener('submit',e=>{e.preventDefault();const m=$('#fmsg'),d=Object.fromEntries(new FormData(f));
    if(!d.name.trim()){m.className='fmsg err';m.textContent='Enter your name.';return}
    if(d.message.trim().length<5){m.className='fmsg err';m.textContent='Write a short message so we can help.';return}
    const txt=`Hello ${CONFIG.BRAND}, I'm ${d.name.trim()}${d.phone?' ('+d.phone.trim()+')':''}.\n\n${d.message.trim()}`;
    m.className='fmsg ok';m.textContent=mode==='wa'?'Opening WhatsApp…':'Opening your email app…';
    if(mode==='wa')window.open('https://wa.me/'+CONFIG.WHATSAPP+'?text='+encodeURIComponent(txt),'_blank','noopener');
    else location.href=`mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('Message from '+d.name.trim())}&body=${encodeURIComponent(txt)}`})}

/* ================= CHECKOUT PAGE (writes one row to the Orders sheet) ================= */
function initCheckout(){const c=getCart(),box=$('#coBox');
  if(!c.length){box.innerHTML='<div class="empty"><h3>Your cart is empty</h3><p>Add something before checking out.</p><a class="btn" href="index.html#shop">Browse products</a></div>';return}
  let sub=0;const lines=c.map(i=>{sub+=i.price*i.qty;return `<div class="r"><span>${esc(i.name)}${i.size?' ('+esc(i.size)+')':''} × ${i.qty}</span><span>${inr(i.price*i.qty)}</span></div>`}).join('');
  const ship=sub>=CONFIG.FREE_SHIP_ABOVE?0:CONFIG.SHIPPING,total=sub+ship;
  $('#coSum').innerHTML=`<h2>Your order</h2>${lines}<div class="r"><span>Delivery</span><span>${ship?inr(ship):'Free'}</span></div><div class="r t"><span>Total</span><span>${inr(total)}</span></div>`;
  $('#upiId').textContent=CONFIG.UPI_ID;
  const f=$('#coForm'),pm=()=>f.pm.value;
  $$('input[name=pm]',f).forEach(r=>r.addEventListener('change',()=>{$('#txnWrap').hidden=pm()!=='UPI'}));
  f.addEventListener('submit',async e=>{e.preventDefault();const m=$('#coMsg'),v=Object.fromEntries(new FormData(f)),err=t=>{m.className='fmsg err';m.textContent=t};
    if(v.name.trim().length<2)return err('Enter your full name.');
    if(!/^(\+?91)?[6-9]\d{9}$/.test(v.phone.replace(/[\s-]/g,'')))return err('Enter a valid 10-digit mobile number.');
    if(v.address.trim().length<10)return err('Enter your full delivery address with pincode.');
    if(pm()==='UPI'&&v.txn.trim().length<6)return err('Enter the UPI transaction ID after you pay.');
    /* The server re-reads prices from the Products sheet and saves the order (action=createOrder). */
    const data={Name:v.name.trim(),Address:v.address.trim(),Phone:v.phone.trim(),'Payment Method':pm()==='UPI'?'UPI':'Cash on Delivery','Transaction ID':pm()==='UPI'?v.txn.trim():'',
      cart:c.map(i=>({id:i.id,name:i.name,size:i.size||'',qty:i.qty}))};
    const btn=f.querySelector('[type=submit]');btn.disabled=true;m.className='fmsg';m.textContent='Placing your order…';
    try{let id='DEMO-'+Date.now().toString(36).toUpperCase();
      if(CONFIG.SHEET_API_URL){const r=await fetch(CONFIG.SHEET_API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'createOrder',data})});const j=await r.json();
        if(!j||j.success===false||j.error){const e=new Error(j&&(j.error||j.message)||'Order failed');e.server=true;throw e}id=j.orderId||id}
      write('cart',[]);badges();$('#coBox').hidden=true;const d=$('#coDone');d.hidden=false;
      $('#coId').textContent=id;$('#coDemo').hidden=!!CONFIG.SHEET_API_URL;
      $('#coWa').href='https://wa.me/'+CONFIG.WHATSAPP+'?text='+encodeURIComponent(`Hello, I placed order ${id} for ${inr(total)}.`);window.scrollTo(0,0)}
    catch(x){console.error(x);err(x.server?x.message:'We couldn’t place the order. Check your connection and try again, or message us on WhatsApp.');btn.disabled=false}})}

/* ================= BOOT ================= */
chrome();
window.addEventListener('storage',badges);
if(PAGE==='home')initHome();if(PAGE==='cart')renderCart();if(PAGE==='wishlist')renderWish();if(PAGE==='contact')initContact();if(PAGE==='checkout')initCheckout();
