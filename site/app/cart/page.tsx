// Cart page. Renders from localStorage phx_cart via an inline script (same pattern as the header counters in layout.tsx).
// Checkout is enabled only when STRIPE_SECRET_KEY is set at render time (architecture/storefront.md).
// ?paid=1 never clears anything on its own: the cart asks /api/checkout/verify, then removes only the purchased quantities once per session.
import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Cart" };

const CSS = `
.cart-page{padding-bottom:24px}
.cart-page [hidden]{display:none!important}
.cart-page .lattice.three{grid-template-columns:minmax(0,1fr) auto auto}
.cart-page .row{display:grid;grid-column:1/-1;grid-template-columns:subgrid}
.cart-page .cell{justify-content:center;gap:4px;min-width:0}
.cart-page .cell:hover{outline:none}
.cart-page .cell.h{padding:8px 16px;background:var(--ground)}
.cart-page .qc{align-items:flex-start}
.cart-page .sku{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.cart-page .name{font-size:15px;font-weight:500;line-height:1.35;overflow-wrap:anywhere}
.cart-page .qty input{width:36px;border:0;border-left:1px solid var(--ink);border-right:1px solid var(--ink);border-radius:0;background:var(--surface);padding:0;text-align:center;font-family:var(--mono);font-size:13px;font-variant-numeric:tabular-nums}
.cart-page .qty button[aria-disabled="true"]{color:var(--muted);cursor:default}
.cart-page .qty button[aria-disabled="true"]:hover{background:var(--surface)}
.cart-page .qty button:focus-visible,.cart-page .qty input:focus-visible{outline:2px solid var(--ink);outline-offset:-2px}
.cart-page .row.gone .cell{grid-column:1/-1;flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 16px}
.cart-page .row.gone .gone-note{font-size:14px;color:var(--muted);overflow-wrap:anywhere;min-width:0}
.cart-page .summary{margin-top:24px;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;border-top:1px solid var(--ink);padding-top:16px}
.cart-page .summary p{font-size:14px;color:var(--muted)}
.cart-page .summary .acts{display:flex;gap:12px;flex-wrap:wrap}
.cart-page .empty{padding:48px 0;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.cart-page .msg{font-size:14px;color:var(--muted);margin-top:12px;max-width:none}
.cart-page .msg.ok{color:var(--ok)}
.cart-page .msg.err{color:var(--low)}
.cart-page .msg:empty{display:none}
@media (max-width:720px){
  .cart-page .lattice.three{grid-template-columns:minmax(0,1fr)}
  .cart-page .cell.h{display:none}
  .cart-page .row{grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:16px;border-right:1px solid var(--hair);border-bottom:1px solid var(--hair);background:var(--canvas)}
  .cart-page .row .cell{border:0;padding:0;background:none}
  .cart-page .row .part{grid-column:1/-1;gap:0}
  .cart-page .row .name{display:flex;align-items:center}
  .cart-page .row .rc{align-items:flex-end}
  .cart-page .qty{height:44px}
  .cart-page .qty button{width:44px;font-size:18px}
  .cart-page .qty input{width:56px;font-size:16px}
  .cart-page .row .btn.sm{height:44px;min-width:44px;padding:0 16px;font-size:15px}
  .cart-page .summary .acts{width:100%}
  .cart-page .summary .btn{flex:1}
}
`;

const SCRIPT = `(function(){
  var KEY='phx_cart', QKEY='phx_quote', FROM='phx_quote_from_cart', PAID='phx_paid_sessions', UNDO_MS=5000;
  var STORE_ERR='Could not save. Your browser is blocking site storage.';
  var list=document.getElementById('cartList'), empty=document.getElementById('cartEmpty'), summary=document.getElementById('cartSummary');
  var count=document.getElementById('cartPageCount'), msg=document.getElementById('cartMsg'), live=document.getElementById('cartLive'), root=document.getElementById('cartRoot');
  var checkout=document.getElementById('checkoutBtn'), quoteBtn=document.getElementById('quoteBtn');
  var paymentsLive = root && root.getAttribute('data-live')==='1';
  var undo={};
  function read(k){ try{ var a=JSON.parse(localStorage.getItem(k)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function write(k,a){ var s=JSON.stringify(a); try{ localStorage.setItem(k,s); if(localStorage.getItem(k)!==s) return false; }catch(e){ return false; } window.dispatchEvent(new Event('phx:change')); return true; }
  function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
  function say(text,kind){ if(!msg) return; msg.textContent=text||''; msg.className='msg'+(kind?' '+kind:''); }
  function announce(text){ if(live){ live.textContent=''; live.textContent=text; } }
  function clampQty(v){ var n=parseInt(v,10); if(!(n>=1)) n=1; return Math.min(999,n); }
  function items(){ return read(KEY).filter(function(x){ return x && x.sku; }); }
  function indexOf(a,sku){ for(var i=0;i<a.length;i++){ if(a[i] && a[i].sku===sku) return i; } return -1; }
  function rows(){ return Array.prototype.slice.call(list.children).filter(function(n){ return n.hasAttribute('data-sku'); }); }
  function findRow(sku){ var r=rows(); for(var i=0;i<r.length;i++){ if(r[i].getAttribute('data-sku')===sku) return r[i]; } return null; }
  function updateCount(){
    var total=items().reduce(function(n,x){ return n+clampQty(x.qty); },0);
    if(count) count.textContent = total===1 ? '1 item' : total+' items';
  }
  function focusKey(){
    var a=document.activeElement; if(!a || !list.contains(a)) return null;
    var row=a.closest('[data-sku]'); if(!row) return null;
    return {sku:row.getAttribute('data-sku'), ctl:a.getAttribute('data-ctl'), pos:rows().indexOf(row)};
  }
  function restoreFocus(k){
    if(!k) return;
    var row=findRow(k.sku), t=null;
    if(row) t=(k.ctl && row.querySelector('[data-ctl="'+k.ctl+'"]')) || row.querySelector('[data-ctl="rm"],[data-ctl="undo"]');
    if(!t){ var r=rows(); if(r.length) t=r[Math.min(Math.max(k.pos,0),r.length-1)].querySelector('[data-ctl="rm"],[data-ctl="undo"]'); }
    if(!t) t = summary.hidden ? empty.querySelector('a') : quoteBtn;
    if(t) t.focus();
  }
  function buildRow(it){
    var qty=clampQty(it.qty), sku=it.sku;
    var row=el('div','row'); row.setAttribute('role','listitem'); row.setAttribute('data-sku',sku);
    var part=el('div','cell part');
    part.appendChild(el('span','mono sku',sku));
    var a=el('a','name',it.name||sku); a.href='/part/'+encodeURIComponent(it.slug||sku); part.appendChild(a);
    row.appendChild(part);
    var qc=el('div','cell qc'), q=el('div','qty');
    var minus=el('button',null,'-'); minus.type='button'; minus.setAttribute('data-ctl','dec'); minus.setAttribute('aria-label','Decrease quantity of '+sku);
    var input=el('input'); input.type='text'; input.value=String(qty); input.setAttribute('inputmode','numeric'); input.setAttribute('pattern','[0-9]*'); input.setAttribute('maxlength','3'); input.setAttribute('autocomplete','off'); input.setAttribute('enterkeyhint','done'); input.setAttribute('data-ctl','qty'); input.setAttribute('aria-label','Quantity of '+sku);
    var plus=el('button',null,'+'); plus.type='button'; plus.setAttribute('data-ctl','inc'); plus.setAttribute('aria-label','Increase quantity of '+sku);
    minus.setAttribute('aria-disabled', qty<=1 ? 'true' : 'false');
    minus.addEventListener('click',function(){ step(sku,-1); });
    plus.addEventListener('click',function(){ step(sku,1); });
    input.addEventListener('change',function(){ commit(sku,input); });
    input.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); commit(sku,input); } });
    q.appendChild(minus); q.appendChild(input); q.appendChild(plus); qc.appendChild(q); row.appendChild(qc);
    var rc=el('div','cell rc');
    var rm=el('button','btn ghost sm','Remove'); rm.type='button'; rm.setAttribute('data-ctl','rm'); rm.setAttribute('aria-label','Remove '+sku+' from cart');
    rm.addEventListener('click',function(){ removeItem(sku); });
    rc.appendChild(rm); row.appendChild(rc);
    return row;
  }
  function buildGone(sku){
    var row=el('div','row gone'); row.setAttribute('role','listitem'); row.setAttribute('data-sku',sku);
    var cell=el('div','cell');
    cell.appendChild(el('span','gone-note','Removed '+sku+'.'));
    var ub=el('button','btn ghost sm','Undo'); ub.type='button'; ub.setAttribute('data-ctl','undo'); ub.setAttribute('aria-label','Undo remove '+sku);
    ub.addEventListener('click',function(){ restore(sku); });
    cell.appendChild(ub); row.appendChild(cell);
    return row;
  }
  function render(){
    var k=focusKey(), its=items();
    var pend=Object.keys(undo).filter(function(s){ return indexOf(its,s)<0; });
    updateCount();
    while(list.firstChild) list.removeChild(list.firstChild);
    if(!its.length && !pend.length){ empty.hidden=false; summary.hidden=true; list.hidden=true; restoreFocus(k); return; }
    empty.hidden=true; summary.hidden=!its.length; list.hidden=false;
    ['Part','Qty',''].forEach(function(t){ var h=el('div','cell h eyebrow',t); h.setAttribute('aria-hidden','true'); list.appendChild(h); });
    var out=its.map(buildRow);
    pend.sort(function(a,b){ return undo[a].index-undo[b].index; }).forEach(function(s){ out.splice(Math.min(undo[s].index,out.length),0,buildGone(s)); });
    out.forEach(function(r){ list.appendChild(r); });
    restoreFocus(k);
  }
  function setQty(sku,q,input){
    var a=read(KEY), i=indexOf(a,sku); if(i<0){ render(); return; }
    q=clampQty(q); a[i].qty=q;
    if(!write(KEY,a)){ say(STORE_ERR,'err'); q=clampQty(read(KEY)[i] && read(KEY)[i].qty); }
    var row=findRow(sku); if(!row){ render(); return; }
    var inp=input||row.querySelector('[data-ctl="qty"]'), dec=row.querySelector('[data-ctl="dec"]');
    if(inp && inp.value!==String(q)) inp.value=String(q);
    if(dec) dec.setAttribute('aria-disabled', q<=1 ? 'true' : 'false');
    updateCount();
  }
  function step(sku,d){
    var a=read(KEY), i=indexOf(a,sku); if(i<0){ render(); return; }
    var cur=clampQty(a[i].qty), next=Math.min(999,Math.max(1,cur+d));
    if(next===cur) return; // minus clamps at 1 and never removes
    setQty(sku,next);
    announce('Quantity of '+sku+' is '+next+'.');
  }
  function commit(sku,input){
    var v=String(input.value).trim(), a=read(KEY), i=indexOf(a,sku); if(i<0){ render(); return; }
    if(!/^[0-9]+$/.test(v) || parseInt(v,10)<1){ input.value=String(clampQty(a[i].qty)); return; }
    setQty(sku,v,input);
  }
  function removeItem(sku){
    var a=read(KEY), i=indexOf(a,sku); if(i<0){ render(); return; }
    var item=a[i]; a.splice(i,1);
    if(!write(KEY,a)){ say(STORE_ERR,'err'); return; }
    var k=focusKey();
    if(undo[sku]) clearTimeout(undo[sku].timer);
    undo[sku]={item:item,index:i,timer:setTimeout(function(){ expire(sku); },UNDO_MS)};
    render();
    if(k && k.sku===sku){ var row=findRow(sku), ub=row && row.querySelector('[data-ctl="undo"]'); if(ub) ub.focus(); }
    announce('Removed '+sku+' from cart. Undo is available for 5 seconds.');
  }
  function expire(sku){ if(!undo[sku]) return; delete undo[sku]; render(); }
  function restore(sku){
    var rec=undo[sku]; if(!rec) return;
    clearTimeout(rec.timer); delete undo[sku];
    var a=read(KEY), i=indexOf(a,sku);
    if(i>=0){ a[i].qty=clampQty(clampQty(a[i].qty)+clampQty(rec.item.qty)); }
    else { a.splice(Math.min(rec.index,a.length),0,rec.item); }
    if(!write(KEY,a)) say(STORE_ERR,'err');
    var k=focusKey();
    render();
    if(k && k.sku===sku){ var row=findRow(sku), rm=row && row.querySelector('[data-ctl="rm"]'); if(rm) rm.focus(); }
    announce('Restored '+sku+' to cart.');
  }
  function cartHash(c){
    var s=JSON.stringify(c.map(function(x){ return [String(x.sku),clampQty(x.qty)]; }).sort(function(a,b){ return a[0]<b[0]?-1:a[0]>b[0]?1:0; }));
    var h=5381; for(var i=0;i<s.length;i++){ h=((h*33)^s.charCodeAt(i))>>>0; }
    return h.toString(36)+'.'+s.length;
  }
  function readFrom(){ try{ var o=JSON.parse(localStorage.getItem(FROM)||'null'); return o && typeof o==='object' && !Array.isArray(o) ? o : null; }catch(e){ return null; } }
  if(quoteBtn) quoteBtn.addEventListener('click',function(){
    var cart=items(); if(!cart.length) return;
    var hash=cartHash(cart), prev=readFrom();
    if(prev && prev.hash===hash){ window.location.href='/quote'; return; } // unchanged cart, already in the quote list
    var sent=(prev && prev.items && typeof prev.items==='object') ? prev.items : {};
    var quote=read(QKEY).filter(function(x){ return x && x.sku; }), now={};
    // Back out what the last transfer added, then add the current cart, so each SKU appears once with the cart's quantity on top of any quote-only quantity.
    Object.keys(sent).forEach(function(sku){ var j=indexOf(quote,sku); if(j>=0) quote[j].qty=(parseInt(quote[j].qty,10)||0)-(parseInt(sent[sku],10)||0); });
    cart.forEach(function(c){
      var n=clampQty(c.qty), j=indexOf(quote,c.sku);
      now[c.sku]=(now[c.sku]||0)+n;
      if(j>=0){ quote[j].qty=Math.min(999,Math.max(0,parseInt(quote[j].qty,10)||0)+n); if(!quote[j].name && c.name) quote[j].name=c.name; if(!quote[j].slug && c.slug) quote[j].slug=c.slug; }
      else quote.push({sku:c.sku,qty:n,name:c.name||'',slug:c.slug||''});
    });
    quote=quote.filter(function(x){ return (parseInt(x.qty,10)||0)>0; });
    if(!write(QKEY,quote) || !write(FROM,{hash:hash,items:now})){ say(STORE_ERR+' Your quote list was not updated.','err'); return; }
    window.location.href='/quote';
  });
  if(checkout && paymentsLive) checkout.addEventListener('click',function(){
    var its=items().map(function(x){ return {sku:x.sku, qty:clampQty(x.qty)}; });
    if(!its.length) return;
    checkout.disabled=true; say('Opening checkout.');
    fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:its})})
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })
      .then(function(x){ if(x.ok && x.d && x.d.url){ window.location.href=x.d.url; } else { say((x.d && x.d.error) || 'Checkout could not start. Request a quote instead.','err'); checkout.disabled=false; } })
      .catch(function(){ say('Checkout could not start. Request a quote instead.','err'); checkout.disabled=false; });
  });
  function cleanUrl(){ try{ history.replaceState(null,'','/cart'); }catch(e){} }
  function applyPaid(sid,bought){
    var done=read(PAID).filter(function(s){ return typeof s==='string'; });
    if(done.indexOf(sid)<0){
      done.push(sid); if(done.length>50) done=done.slice(-50);
      // Mark the session first: a failed cart write must never lead to a second removal on a later visit.
      if(!write(PAID,done)){ say('Payment received. We could not update your cart in this browser, so remove the purchased parts yourself.','err'); return; }
      var cart=read(KEY);
      bought.forEach(function(b){
        if(!b || typeof b.sku!=='string') return;
        var n=parseInt(b.qty,10)||0, i=indexOf(cart,b.sku); if(n<1 || i<0) return;
        var left=clampQty(cart[i].qty)-n;
        if(left>0) cart[i].qty=left; else cart.splice(i,1);
      });
      if(!write(KEY,cart)){ say('Payment received. We could not update your cart in this browser, so remove the purchased parts yourself.','err'); render(); return; }
    }
    say('Payment received. Your order confirmation will arrive by email.','ok');
    render();
  }
  var params=null; try{ params=new URLSearchParams(window.location.search); }catch(e){}
  if(params && params.get('paid')==='1' && paymentsLive){
    var sid=params.get('session_id')||'';
    if(!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sid)){ say('We could not confirm a payment from this link. Your cart is unchanged.'); cleanUrl(); }
    else {
      say('Checking your payment.');
      fetch('/api/checkout/verify?session_id='+encodeURIComponent(sid),{cache:'no-store'})
        .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ return {status:r.status,d:d}; }); })
        .then(function(x){
          if(x.status===200 && x.d && x.d.paid===true && Array.isArray(x.d.items)){ applyPaid(sid,x.d.items); cleanUrl(); }
          else if(x.status===200){ say('Payment is not confirmed yet. Your cart is unchanged.'); }
          else if(x.status===400 || x.status===404){ say('We could not confirm a payment from this link. Your cart is unchanged.'); cleanUrl(); }
          else { say('We could not confirm your payment right now. Your cart is unchanged. Reload this page to try again.','err'); }
        })
        .catch(function(){ say('We could not confirm your payment right now. Your cart is unchanged. Reload this page to try again.','err'); });
    }
  }
  else if(params && params.get('cancelled')==='1'){ say('Checkout was cancelled. Your cart is unchanged.'); cleanUrl(); }
  render();
})();`;

export default function CartPage() {
  const paymentsLive = Boolean(process.env.STRIPE_SECRET_KEY);
  return (
    <main className="cart-page frame" id="cartRoot" data-live={paymentsLive ? "1" : "0"}>
      <style>{CSS}</style>
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Cart</span></nav>
      <div className="page-h">
        <h1>Cart</h1>
        <span className="cnt" id="cartPageCount" suppressHydrationWarning>0 items</span>
      </div>

      <p className="msg" id="cartMsg" role="status" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
      <p className="sr" id="cartLive" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />

      <div className="lattice three" id="cartList" role="list" aria-label="Cart items" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />

      <div className="empty" id="cartEmpty" hidden suppressHydrationWarning>
        <p>Your cart is empty.</p>
        <a className="btn ghost" href="/parts">Browse parts</a>
      </div>

      <div className="summary" id="cartSummary" hidden suppressHydrationWarning>
        <div>
          <p>Prices are confirmed on the invoice. Checkout opens when payments go live.</p>
          <p>Prices in AUD, GST inclusive. Questions, call <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>.</p>
        </div>
        <div className="acts">
          <button className="btn ghost" type="button" id="quoteBtn">Request a quote for this cart</button>
          <button className="btn" type="button" id="checkoutBtn" suppressHydrationWarning disabled={!paymentsLive} aria-disabled={!paymentsLive} title={paymentsLive ? undefined : "Checkout opens when payments go live"}>Checkout</button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </main>
  );
}
