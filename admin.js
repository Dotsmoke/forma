'use strict';
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
function buildDesc(intro,feats){
  const clean=s=>String(s||'').replace(new RegExp(PIC,'gu'),'').replace(/️/g,'').replace(/\s+/g,' ').trim();
  const out=String(intro||'').split(/\n+/).map(clean).map(s=>s.replace(NUM_,'').replace(BUL_,'')).filter(Boolean);
  feats.forEach(f=>{const t=clean(f.t).replace(/\s*:\s*/g,' ').slice(0,45),d=clean(f.d);if(t||d)out.push('🌿 '+(t&&d?t+': '+d:t||d))});
  return out.join('\n')}
const NUM_=/^\d{1,2}[.)]\s+/,BUL_=/^[*•\-–—·▪●]\s+/;

/* ================= CONFIG ================= */
/* Same web-app URL you use in common.js (CONFIG.SHEET_API_URL) */
const API='https://script.google.com/macros/s/AKfycbxmKGi8uX5raJzIzdiAPQyfQ6J89TJjFHE9Mz_AjCUL8Gg-iX3VcLU2LJ8e9A4-0pIM/exec';
const ORDER_STATUSES=['New','Confirmed','Packed','Shipped','Delivered','Cancelled'];

/* ================= HELPERS ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+(+n||0).toLocaleString('en-IN');
const nk=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const g=(o,k)=>{k=nk(k);for(const x in o)if(nk(x)===k)return o[x];return ''};
const num=v=>+String(v??'').replace(/[^\d.]/g,'')||0;
const list=v=>String(v??'').split(/[\n|,]/).map(x=>x.trim()).filter(Boolean);
const stKey=o=>String(g(o,'Order Status')||'New').trim()||'New';
const pendingPay=o=>/pending|verify/i.test(String(g(o,'Payment Status')))&&!/paid/i.test(String(g(o,'Payment Status')));
const S={token:'',orders:[],products:[],tab:'orders',ostat:'',oq:'',pq:'',dirty:false};
try{S.token=sessionStorage.getItem('adm_t')||''}catch{}
function toast(m,bad){const t=$('#toast');t.textContent=m;t.classList.toggle('bad',!!bad);requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
async function api(action,payload={}){
  let j;try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:S.token,...payload})});j=await r.json()}
  catch{throw new Error('Could not reach the server. Check your internet connection.')}
  if(j.error||j.success===false){if(j.code==='auth')signOut('Session expired. Please sign in again.');throw new Error(j.message||(typeof j.error==='string'?j.error:'')||'Something went wrong')}return j}

/* ================= LOGIN ================= */
function showApp(on){$('#login').hidden=on;$('#app').hidden=!on}
function signOut(msg){S.token='';try{sessionStorage.removeItem('adm_t')}catch{};closeDrawer(true);showApp(false);$('#lp').value='';$('#lerr').textContent=msg||''}
$('#lshow').onclick=()=>{const p=$('#lp'),s=p.type==='password';p.type=s?'text':'password';$('#lshow i').className=s?'fa-regular fa-eye-slash':'fa-regular fa-eye'};
$('#lform').onsubmit=async e=>{e.preventDefault();const b=$('#lbtn'),er=$('#lerr');er.textContent='';b.disabled=true;b.textContent='Signing in…';
  try{const j=await api('login',{user:$('#lu').value.trim(),pass:$('#lp').value});S.token=j.token;try{sessionStorage.setItem('adm_t',j.token)}catch{};showApp(true);await load()}
  catch(x){er.textContent=x.message}finally{b.disabled=false;b.textContent='Sign in'}};
$('#logout').onclick=()=>signOut('');

/* ================= DATA ================= */
async function load(quiet){
  if(!quiet){$('#olist').innerHTML='<div class="skel"></div>'.repeat(4);$('#plist').innerHTML='<div class="skel"></div>'.repeat(4)}
  try{const j=await api('load');S.orders=(j.orders||[]).sort((a,b)=>b._row-a._row);S.products=j.products||[];renderAll()}
  catch(x){if(S.token)toast(x.message,true)}}
$('#refresh').onclick=async()=>{const i=$('#refresh i');i.classList.add('fa-spin');await load(true);i.classList.remove('fa-spin');toast('Updated')};

/* ================= TABS ================= */
$$('#tabs [data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;$$('#tabs [data-tab]').forEach(x=>x.setAttribute('aria-current',x===b?'page':'false'));$('#p-orders').hidden=S.tab!=='orders';$('#p-products').hidden=S.tab!=='products';window.scrollTo(0,0)});
$('#oq').oninput=e=>{S.oq=e.target.value;renderOrders()};$('#pq').oninput=e=>{S.pq=e.target.value;renderProducts()};
function renderAll(){renderStats();renderOrders();renderProducts()}

/* ================= ORDERS ================= */
function renderStats(){
  const live=S.orders.filter(o=>stKey(o)!=='Cancelled'),nw=S.orders.filter(o=>stKey(o)==='New'||pendingPay(o)&&stKey(o)!=='Cancelled').length,rev=live.reduce((s,o)=>s+num(g(o,'Subtotal')),0);
  $('#stats').innerHTML=[['fa-bag-shopping','Total orders',S.orders.length,''],['fa-bell','Waiting for you',nw,nw?'hot':''],['fa-indian-rupee-sign','Revenue (not cancelled)',inr(rev),'gold'],['fa-jar','Products',S.products.length,'']]
    .map(s=>`<div class="stat ${s[3]}"><i class="fa-solid ${s[0]}"></i><div><b>${esc(s[2])}</b><small>${s[1]}</small></div></div>`).join('');
  const nb=$('#newBadge');nb.hidden=!nw;nb.textContent=nw}
const itemLines=o=>String(g(o,'Items')).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
function renderOrders(){
  const q=S.oq.trim().toLowerCase(),cnt={};S.orders.forEach(o=>cnt[stKey(o)]=(cnt[stKey(o)]||0)+1);
  $('#ofilters').innerHTML=['',...ORDER_STATUSES].map(s=>`<button class="chip" type="button" data-s="${s}" aria-pressed="${s===S.ostat}">${s||'All'}<small>${s?(cnt[s]||0):S.orders.length}</small></button>`).join('');
  $$('#ofilters .chip').forEach(b=>b.onclick=()=>{S.ostat=b.dataset.s;renderOrders()});
  const l=S.orders.filter(o=>(!S.ostat||stKey(o)===S.ostat)&&(!q||Object.values(o).some(v=>String(v).toLowerCase().includes(q))));
  $('#olist').innerHTML=l.length?l.map(o=>{const its=itemLines(o).filter(x=>!/^delivery\b/i.test(x)),first=(its[0]||'').replace(/\s*=\s*₹.*$/,'');
    return `<button class="orow" type="button" data-o="${o._row}"><div class="o-id"><b>#${esc(g(o,'Order ID')||o._row)}</b><small>${esc(g(o,'Date'))}</small></div>
<div class="o-cust"><b>${esc(g(o,'Name'))}</b><small>${esc(g(o,'Phone'))}</small></div>
<div class="o-items"><span>${esc(first)}</span>${its.length>1?`<small>+${its.length-1} more item${its.length>2?'s':''}</small>`:''}</div>
<div class="o-tot"><b>${inr(num(g(o,'Subtotal')))}</b><small>${esc(g(o,'Payment Method'))}${pendingPay(o)?' · <span style="color:var(--rose);font-weight:600">verify payment</span>':''}</small></div><span class="pill st-${stKey(o).toLowerCase()}">${esc(stKey(o))}</span></button>`}).join(''):`<div class="empty"><h3>${S.orders.length?'No matching orders':'No orders yet'}</h3><p>${S.orders.length?'Try another search or status.':'New orders from your shop will show up here.'}</p></div>`;
  $$('.orow').forEach(b=>b.onclick=()=>openOrder(+b.dataset.o))}

const waNum=p=>{let d=String(p).replace(/\D/g,'');if(d.length===10)d='91'+d;return d};
function openOrder(row){
  const o=S.orders.find(x=>x._row===row);if(!o)return;const st=stKey(o),phone=String(g(o,'Phone')),name=g(o,'Name'),id=g(o,'Order ID')||row;
  const handled=['name','address','addressline2','city','stateprovince','postalcode','country','email','paymentmethod','phone','date','transactionid','items','subtotal','orderid','orderstatus','paymentstatus','shippingstatus','awbnumber','trackingurl'];
  const extra=Object.keys(o).filter(k=>k!=='_row'&&!handled.includes(nk(k))&&String(o[k]).trim());
  const addr=[g(o,'Address'),g(o,'Address Line 2'),[g(o,'City'),g(o,'State / Province'),g(o,'Postal Code')].filter(Boolean).join(', '),g(o,'Country')].filter(x=>String(x).trim()).join('\n');
  const lines=itemLines(o).map(l=>{const m=l.match(/^(.*?)\s*=\s*(₹\s*[\d,.]+)\s*$/);return m?`<div class="li"><span>${esc(m[1])}</span><b>${esc(m[2])}</b></div>`:`<div class="li"><span>${esc(l)}</span></div>`}).join('');
  const msg=`Hello ${name}, this is Marsuki. Regarding your order #${id}.`,pend=pendingPay(o),ps=String(g(o,'Payment Status')),ss=String(g(o,'Shipping Status'));
  openDrawer(`Order #${esc(id)}`,`
${pend?`<div class="box" style="background:var(--rose-l)"><h3 style="color:var(--rose)">Payment not verified yet</h3><p style="margin-bottom:10px">This is a UPI order. Check the transaction ID <b>${esc(g(o,'Transaction ID'))}</b> in your UPI app, then confirm. The order stays on hold until you do.</p><button class="btn sm" type="button" id="vPay"><i class="fa-solid fa-circle-check"></i>I verified the payment</button></div>`:''}
<div class="box"><h3>Order status</h3><div class="sts" id="sts">${ORDER_STATUSES.map(s=>`<button class="chip" type="button" data-st="${s}" aria-pressed="${s===st}">${s}</button>`).join('')}</div></div>
<div class="acts"><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(phone)}?text=${encodeURIComponent(msg)}"><i class="fa-brands fa-whatsapp"></i>WhatsApp</a><a class="btn ghost sm" href="tel:${esc(phone.replace(/\s/g,''))}"><i class="fa-solid fa-phone"></i>Call</a><button class="btn ghost sm" type="button" id="cpAddr"><i class="fa-regular fa-copy"></i>Copy address</button></div>
<div class="box"><h3>Customer</h3><dl class="kv"><dt>Name</dt><dd>${esc(name)}</dd><dt>Phone</dt><dd>${esc(phone)}</dd>${g(o,'Email')?`<dt>Email</dt><dd>${esc(g(o,'Email'))}</dd>`:''}<dt>Address</dt><dd>${esc(addr)}</dd><dt>Placed</dt><dd>${esc(g(o,'Date'))}</dd></dl></div>
<div class="box items"><h3>Items</h3>${lines||'<p class="muted">No items recorded.</p>'}<div class="tot"><span>Total</span><span>${inr(num(g(o,'Subtotal')))}</span></div></div>
<div class="box"><h3>Payment &amp; shipping</h3><dl class="kv"><dt>Method</dt><dd>${esc(g(o,'Payment Method'))}</dd>${ps?`<dt>Payment</dt><dd>${esc(ps)}</dd>`:''}${ss?`<dt>Shipping</dt><dd>${esc(ss)}</dd>`:''}${g(o,'Transaction ID')?`<dt>UPI txn ID</dt><dd>${esc(g(o,'Transaction ID'))}</dd>`:''}</dl></div>
<div class="box"><h3>Tracking <span class="hint">(optional, for your records)</span></h3><div style="display:grid;gap:10px"><label>AWB / tracking number<input id="tAwb" value="${esc(g(o,'AWB Number'))}"></label><label>Tracking link<input id="tUrl" type="url" placeholder="https://…" value="${esc(g(o,'Tracking URL'))}"></label><div class="acts"><button class="btn ghost sm" type="button" id="tSave">Save tracking</button>${g(o,'Tracking URL')?`<a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(g(o,'Tracking URL'))}">Open link</a>`:''}</div></div></div>
${extra.length?`<div class="box"><h3>Other details</h3><dl class="kv">${extra.map(k=>`<dt>${esc(k)}</dt><dd>${esc(o[k])}</dd>`).join('')}</dl></div>`:''}`);
  $('#cpAddr').onclick=async()=>{try{await navigator.clipboard.writeText(`${name}\n${addr}\n${phone}`);toast('Address copied')}catch{toast('Could not copy',true)}};
  const oid=String(g(o,'Order ID'));
  if(pend)$('#vPay').onclick=async()=>{const b=$('#vPay');b.disabled=true;try{await api('verifyPayment',{row:o._row,orderId:oid});o['Payment Status']='PAID - VERIFIED';if(/^ON HOLD/i.test(String(g(o,'Shipping Status'))))o['Shipping Status']='PENDING SHIPROCKET';toast('Payment marked as verified');renderStats();renderOrders();openOrder(row)}catch(x){toast(x.message,true);b.disabled=false}};
  $('#tSave').onclick=async()=>{const b=$('#tSave');b.disabled=true;try{await api('setTracking',{row:o._row,orderId:oid,awb:$('#tAwb').value,url:$('#tUrl').value});o['AWB Number']=$('#tAwb').value.trim();o['Tracking URL']=$('#tUrl').value.trim();toast('Tracking saved')}catch(x){toast(x.message,true)}b.disabled=false};
  $('#sts').onclick=async e=>{const b=e.target.closest('[data-st]');if(!b||b.dataset.st===stKey(o))return;const prev=stKey(o);
    $$('#sts .chip').forEach(x=>{x.disabled=true;x.setAttribute('aria-pressed',x===b)});
    try{await api('setOrderStatus',{row:o._row,orderId:oid,status:b.dataset.st});o['Order Status']=b.dataset.st;toast('Marked as '+b.dataset.st);renderStats();renderOrders()}
    catch(x){toast(x.message,true);$$('#sts .chip').forEach(y=>y.setAttribute('aria-pressed',y.dataset.st===prev))}
    $$('#sts .chip').forEach(x=>x.disabled=false)}}

/* ================= PRODUCTS LIST ================= */
function renderProducts(){
  const q=S.pq.trim().toLowerCase(),l=S.products.filter(p=>!q||[p.name,p.category,p.description].some(s=>String(s||'').toLowerCase().includes(q)));
  $('#plist').innerHTML=`<button class="pc add" type="button" id="addCard"><i class="fa-solid fa-plus"></i>Add product</button>`+l.map(p=>{const mrp=num(p.mrp),pr=num(p.price);
    return `<button class="pc" type="button" data-p="${p._row}"><div class="im">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.classList.add('bad')">`:''}${/^(yes|true|y|1|✅)$/i.test(String(p.Recommended).trim())?'<span class="star">★ Recommended</span>':''}</div><small>${esc(p.category||'No category')}</small><h3>${esc(p.name)}</h3><div class="pr"><b>${inr(pr)}</b>${mrp>pr?`<s>${inr(mrp)}</s>`:''}</div></button>`}).join('');
  $$('.pc[data-p]').forEach(b=>b.onclick=()=>openProduct(+b.dataset.p));$('#addCard').onclick=()=>openProduct(0)}
$('#addP').onclick=()=>openProduct(0);

/* ================= DRAWER ================= */
function openDrawer(title,html,foot){
  $('#dTitle').innerHTML=title;$('#dBody').innerHTML=html;$('#dBody').scrollTop=0;const f=$('#dFoot');f.hidden=!foot;f.innerHTML=foot||'';
  $('#drawer').hidden=false;$('#scrim').hidden=false;document.documentElement.classList.add('lock');S.dirty=false;S.last=document.activeElement;$('#dClose').focus()}
function closeDrawer(force){if(!force&&S.dirty&&!confirm('Discard your unsaved changes?'))return;$('#drawer').hidden=true;$('#scrim').hidden=true;document.documentElement.classList.remove('lock');S.dirty=false;S.last&&S.last.focus&&S.last.focus()}
$('#dClose').onclick=()=>closeDrawer();$('#scrim').onclick=()=>closeDrawer();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#drawer').hidden)closeDrawer()});

/* ================= PRODUCT EDITOR ================= */
const grow=t=>{t.style.height='auto';t.style.height=t.scrollHeight+2+'px'};
function featHTML(f,i,n){return `<div class="feat"><div class="fh"><span class="fn">${i+1}</span><input class="ft" maxlength="45" placeholder="Heading, e.g. Gentle Digestive Support" value="${esc(f.t)}" aria-label="Point ${i+1} heading"><div class="fa"><button type="button" class="up" data-fa="up" aria-label="Move up" ${i?'':'disabled'}><i class="fa-solid fa-arrow-up"></i></button><button type="button" data-fa="down" aria-label="Move down" ${i<n-1?'':'disabled'}><i class="fa-solid fa-arrow-down"></i></button><button type="button" class="del" data-fa="del" aria-label="Remove point"><i class="fa-solid fa-trash-can"></i></button></div></div><textarea class="fd" rows="2" placeholder="Details (optional)" aria-label="Point ${i+1} details">${esc(f.d)}</textarea></div>`}
function openProduct(row){
  const p=row?S.products.find(x=>x._row===row):{};if(row&&!p)return;
  const cats=[...new Set(S.products.map(x=>String(x.category||'').trim()).filter(Boolean))],pd=parseDesc(p.description);
  const rec=/^(yes|true|y|1|✅)$/i.test(String(p.Recommended||'').trim());
  openDrawer(row?'Edit product':'New product',`<form id="pf" autocomplete="off" novalidate>
<div class="fsec"><h3>Basics</h3>
<label>Product name<input id="fName" value="${esc(p.name||'')}" placeholder="e.g. Organic Triphala Powder" required></label>
<div class="g2 keep"><label>Price (₹)<input id="fPrice" type="number" inputmode="decimal" min="0" step="any" value="${esc(p.price??'')}" required></label><label>MRP <span class="hint">(optional, crossed out)</span><input id="fMrp" type="number" inputmode="decimal" min="0" step="any" value="${esc(p.mrp??'')}"></label></div>
<div class="g2"><label>Category<input id="fCat" list="cats" value="${esc(p.category||'')}" placeholder="e.g. Wellness"><datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></label>
<label>Sizes <span class="hint">(comma separated, optional)</span><input id="fSizes" value="${esc(p.availableSizes||'')}" placeholder="25 bags, 50 bags"></label></div>
<label class="tog"><input type="checkbox" id="fRec" ${rec?'checked':''}><span class="sw"></span>Show under “Recommended for you”</label></div>
<div class="fsec"><h3>Images</h3>
<div class="imgrow"><div class="imgprev" id="imgPrev"><i class="fa-regular fa-image"></i></div><label style="flex:1">Main image link<input id="fImg" type="url" value="${esc(p.image||'')}" placeholder="https://i.ibb.co/…"></label></div>
<label>More images <span class="hint">(one link per line, shown as thumbnails in the popup)</span><textarea id="fImgs" rows="3" placeholder="https://…">${esc(list(p.images).join('\n'))}</textarea></label><div class="xthumbs" id="xthumbs"></div></div>
<div class="dsec" id="dsec"><div class="dhead"><h3>Description</h3><button class="btn ghost sm" type="button" id="dPasteBtn"><i class="fa-solid fa-wand-magic-sparkles"></i>Paste &amp; auto-format</button></div>
<div class="dpaste" id="dPaste" hidden><p class="hint" style="color:#6b5a2c">Paste any text: WhatsApp messages, numbered lists, bullet points or emoji lines. Timestamps and phone numbers are removed and it is split into an intro and key points.</p><textarea id="dRaw" placeholder="Paste here…"></textarea><div class="acts"><button class="btn sm" type="button" id="dConv">Convert</button><button class="btn ghost sm" type="button" id="dCancel">Cancel</button></div></div>
<label>Intro <span class="hint">(the first paragraph customers read)</span><textarea id="dIntro" rows="3" placeholder="A short, inviting summary of the product">${esc(pd.intro.join('\n'))}</textarea></label>
<div><div class="dhead" style="margin-bottom:8px"><strong style="color:var(--moss);font-size:.88rem">Key points</strong><span class="hint">Heading + detail. Shown as a tidy checklist.</span></div><div id="dFeats" style="display:grid;gap:10px"></div><button class="btn ghost sm" type="button" id="dAdd" style="margin-top:10px"><i class="fa-solid fa-plus"></i>Add point</button></div>
<div class="dprev"><h4>Preview on shop</h4><div class="pv" id="dPrev"></div><div class="cnt" id="dCnt"></div></div></div>
${row?`<div id="delBox"><button class="btn danger sm" type="button" id="delBtn"><i class="fa-solid fa-trash-can"></i>Delete product</button></div>`:''}</form>`,
  `<button class="btn ghost" type="button" id="fCancel">Cancel</button><button class="btn main" type="button" id="fSave"><i class="fa-solid fa-check"></i>${row?'Save changes':'Add product'}</button>`);

  const feats=$('#dFeats');
  const read=()=>$$('.feat',feats).map(f=>({t:$('.ft',f).value,d:$('.fd',f).value}));
  const draw=a=>{feats.innerHTML=a.map((f,i)=>featHTML(f,i,a.length)).join('');$$('.fd',feats).forEach(grow)};
  const intro=$('#dIntro');
  const preview=()=>{const fs=read().filter(f=>f.t.trim()||f.d.trim()),ps=intro.value.split(/\n+/).map(s=>s.trim()).filter(Boolean);
    $('#dPrev').innerHTML=(ps.map((s,i)=>`<p${i?'':' style="font-size:1.02rem"'}>${esc(s)}</p>`).join('')||'<p class="muted">Nothing yet.</p>')+(fs.length?`<ul class="mfeat">${fs.map(f=>`<li><i class="fa-solid fa-leaf"></i><div>${f.t.trim()&&f.d.trim()?`<b>${esc(f.t)}</b><span>${esc(f.d)}</span>`:`<span class="t">${esc(f.t||f.d)}</span>`}</div></li>`).join('')}</ul>`:'');
    $('#dCnt').textContent=buildDesc(intro.value,read()).length+' characters'};
  draw(pd.feats);grow(intro);preview();
  const dirty=()=>{S.dirty=true};
  $('#pf').addEventListener('input',e=>{dirty();if(e.target.tagName==='TEXTAREA')grow(e.target);if(e.target.closest('#dsec'))preview();if(e.target.id==='fImg'||e.target.id==='fImgs')imgs()});
  feats.onclick=e=>{const b=e.target.closest('[data-fa]');if(!b)return;const a=read(),i=$$('.feat',feats).indexOf(b.closest('.feat')),k=b.dataset.fa;
    if(k==='del')a.splice(i,1);else{const j=k==='up'?i-1:i+1;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]]}draw(a);preview();dirty()};
  $('#dAdd').onclick=()=>{const a=read();a.push({t:'',d:''});draw(a);preview();dirty();$$('.ft',feats).pop().focus()};
  $('#dPasteBtn').onclick=()=>{$('#dPaste').hidden=false;$('#dRaw').focus()};$('#dCancel').onclick=()=>{$('#dPaste').hidden=true};
  $('#dConv').onclick=()=>{const r=parseDesc($('#dRaw').value);if(!r.intro.length&&!r.feats.length)return toast('Nothing to convert',true);
    intro.value=[intro.value.trim(),...r.intro].filter(Boolean).join('\n');draw([...read().filter(f=>f.t.trim()||f.d.trim()),...r.feats]);grow(intro);preview();dirty();$('#dRaw').value='';$('#dPaste').hidden=true;toast('Formatted. Review the points below.')};
  /* image previews */
  function imgs(){const m=$('#fImg').value.trim(),pv=$('#imgPrev');pv.innerHTML=m?`<img src="${esc(m)}" alt="" onerror="this.classList.add('bad')">`:'<i class="fa-regular fa-image"></i>';
    $('#xthumbs').innerHTML=list($('#fImgs').value).map(u=>`<img src="${esc(u)}" alt="" onerror="this.remove()">`).join('')}imgs();
  $('#fCancel').onclick=()=>closeDrawer();
  /* delete (two-step) */
  const delUI=()=>{$('#delBox').innerHTML='<button class="btn danger sm" type="button" id="delBtn"><i class="fa-solid fa-trash-can"></i>Delete product</button>';
    $('#delBtn').onclick=()=>{$('#delBox').innerHTML=`<div class="confirm">Delete “${esc(p.name)}” for good? <button class="btn danger sm" type="button" id="delYes">Yes, delete</button><button class="btn ghost sm" type="button" id="delNo">Keep</button></div>`;
      $('#delNo').onclick=delUI;
      $('#delYes').onclick=async()=>{const y=$('#delYes');y.disabled=true;try{await api('deleteProduct',{row:p._row,id:String(p.id)});toast('Product deleted');closeDrawer(true);await load(true)}catch(x){toast(x.message,true);y.disabled=false}}}};
  if(row)delUI();
  /* save */
  $('#fSave').onclick=async()=>{const name=$('#fName').value.trim(),price=$('#fPrice').value;
    if(!name){$('#fName').focus();return toast('Enter the product name',true)}
    if(price===''||+price<0){$('#fPrice').focus();return toast('Enter a valid price',true)}
    const mrp=$('#fMrp').value;if(mrp!==''&&+mrp<=+price&&+mrp!==0)toast('Note: MRP is not higher than price, so no discount will show');
    const product={name,price:+price,mrp:mrp===''?'':+mrp,category:$('#fCat').value.trim(),availableSizes:list($('#fSizes').value).join(', '),Recommended:$('#fRec').checked?'yes':'',
      image:$('#fImg').value.trim(),images:list($('#fImgs').value).join(' , '),description:buildDesc(intro.value,read())};
    const b=$('#fSave');b.disabled=true;b.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>Saving…';
    try{await api('saveProduct',{row:p._row||0,id:p.id!==undefined?String(p.id):'',product});toast(row?'Changes saved':'Product added');closeDrawer(true);await load(true)}
    catch(x){toast(x.message,true);b.disabled=false;b.innerHTML=`<i class="fa-solid fa-check"></i>${row?'Save changes':'Add product'}`}}}

/* ================= BOOT ================= */
if(S.token){showApp(true);load()}else showApp(false);
