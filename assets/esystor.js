(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)},
    $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))},
    reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* sticky offset for product tabs */
var mast=$('.mast');
function setMastH(){if(mast)document.documentElement.style.setProperty('--mast-h',mast.offsetHeight+'px')}
setMastH();addEventListener('resize',setMastH);

/* retry product photos once: the store's image server is sometimes slow */
$$('img').forEach(function(im){im.addEventListener('error',function f(){im.removeEventListener('error',f);setTimeout(function(){if(im.src.indexOf('?r=')<0)im.src=im.src+(im.src.indexOf('?')<0?'?':'&')+'r=1'},600)})});

/* ---------- Google Translate language picker ---------- */
$$('.js-lang').forEach(function(sel){
  sel.addEventListener('change',function(){
    var v=sel.value;$$('.js-lang').forEach(function(s){s.value=v});
    var n=0;(function go(){var c=$('.goog-te-combo');
      if(c){c.value=v;c.dispatchEvent(new Event('change'));return}
      if(n++<30)setTimeout(go,200)})();
    if(!v){document.cookie='googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';setTimeout(function(){location.reload()},150)}
  });
});
setTimeout(function(){var m=document.cookie.match(/googtrans=\/en\/([^;]+)/);if(m)$$('.js-lang').forEach(function(s){s.value=decodeURIComponent(m[1])})},300);

/* ---------- mega menu ---------- */
var cats=$$('.cat'),hoverable=matchMedia('(hover:hover) and (min-width:1041px)'),closeT;
function closeAll(except){cats.forEach(function(c){if(c!==except){c.classList.remove('open');$('.cat-tog',c).setAttribute('aria-expanded','false')}})}
cats.forEach(function(c){
  var b=$('.cat-tog',c);
  function open(){closeAll(c);c.classList.add('open');b.setAttribute('aria-expanded','true')}
  b.addEventListener('click',function(){c.classList.contains('open')?closeAll():open()});
  c.addEventListener('mouseenter',function(){if(hoverable.matches){clearTimeout(closeT);open()}});
  c.addEventListener('mouseleave',function(){if(hoverable.matches)closeT=setTimeout(closeAll,140)});
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=$('.cat.open');closeAll();o&&$('.cat-tog',o).focus()}});
document.addEventListener('click',function(e){if(!e.target.closest('.cat'))closeAll()});

/* ---------- drawer ---------- */
var burger=$('.burger'),drawer=$('#drawer'),scrim=$('.scrim');
function setDrawer(on){if(!drawer)return;drawer.hidden=!on;scrim.hidden=!on;burger.setAttribute('aria-expanded',on);document.body.style.overflow=on?'hidden':'';
  if(on)$('.drawer-x').focus();else burger.focus()}
burger&&burger.addEventListener('click',function(){setDrawer(true)});
$('.drawer-x')&&$('.drawer-x').addEventListener('click',function(){setDrawer(false)});
scrim&&scrim.addEventListener('click',function(){setDrawer(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&drawer&&!drawer.hidden)setDrawer(false)});

/* ---------- carousel ---------- */
$$('[data-car]').forEach(function(car){
  var tr=$('.car-track',car),dots=$$('.car-dots button',car),sec=car.closest('section'),i=0,timer;
  function go(n){i=(n+dots.length)%dots.length;tr.scrollTo({left:tr.clientWidth*i,behavior:reduce?'auto':'smooth'})}
  dots.forEach(function(d,n){d.addEventListener('click',function(){go(n);stop()})});
  $('.car-prev',sec)&&$('.car-prev',sec).addEventListener('click',function(){go(i-1);stop()});
  $('.car-next',sec)&&$('.car-next',sec).addEventListener('click',function(){go(i+1);stop()});
  tr.addEventListener('scroll',function(){var n=Math.round(tr.scrollLeft/tr.clientWidth);if(n!==i)i=n;dots.forEach(function(d,k){k===n?d.setAttribute('aria-current','true'):d.removeAttribute('aria-current')})},{passive:true});
  function stop(){clearInterval(timer)}
  if(!reduce){timer=setInterval(function(){go(i+1)},6000);car.addEventListener('mouseenter',stop);car.addEventListener('focusin',stop);tr.addEventListener('touchstart',stop,{passive:true})}
});

/* ---------- the LCD front panel ---------- */
var MENU=[
  {n:'1.Copy',h:'Copies the source drive to every target at once, sector by sector, with partitions and boot sector.',run:['Copying...','PASS:3   FAIL:0']},
  {n:'2.Compare',h:'Compares each target with the source bit by bit and reports any drive that does not match.',run:['Comparing...','Match:3  Diff:0']},
  {n:'3.Copy+Compare',h:'Copies, then verifies every target in one pass. The safest choice for production runs.',run:['Copy+Compare','PASS:3   FAIL:0']},
  {n:'4.PreScan',h:'Reads the whole source first to catch bad sectors before you copy.',run:['Scanning src..','Source OK']},
  {n:'5.DoD Erase',h:'Rewrites every bit of the target drives three times to DoD 5220.22-M. Asks you to confirm first.',confirm:true,run:['DoD Erase 3x','Erased:3 drives']}
];
function pad(s){s=String(s);return (s+'                ').slice(0,16)}
$$('[data-lcd]').forEach(function(p){
  var l1=$('.lcd-l1',p),l2=$('.lcd-l2',p),help=$('.lcd-help',p),idx=0,state='boot',tick;
  function show(a,b){l1.textContent=pad(a);l2.textContent=pad(b||'')}
  function menu(){state='menu';clearInterval(tick);show(MENU[idx].n,'OK:run  ▲▼:mode');help.textContent=MENU[idx].h}
  function run(){var m=MENU[idx],pct=0;state='run';help.textContent='Running. Press ESC to stop.';
    if(reduce){show(m.run[0],m.run[1]);state='done';help.textContent='Done. Press ESC to go back.';return}
    tick=setInterval(function(){pct+=5;var bars=Math.round(pct/100*10);
      show(m.run[0],'█'.repeat(bars)+'░'.repeat(10-bars)+' '+(pct<100?(' '+pct).slice(-3)+'%':''));
      if(pct>=100){clearInterval(tick);show(m.run[0].replace('...',''),m.run[1]);state='done';help.textContent='Done. Every drive gets a pass or fail. Press ESC to go back.'}},90)}
  function key(k){
    var b=$('[data-k="'+k+'"]',p);if(b){b.classList.add('hit');setTimeout(function(){b.classList.remove('hit')},120)}
    if(state==='boot')return menu();
    if(state==='menu'){
      if(k==='up'){idx=(idx-1+MENU.length)%MENU.length;menu()}
      else if(k==='down'){idx=(idx+1)%MENU.length;menu()}
      else if(k==='ok'){if(MENU[idx].confirm){state='confirm';show('Erase targets?','OK:yes  ESC:no');help.textContent='Erasing cannot be undone. The source port stays read-only.'}else run()}
    }else if(state==='confirm'){k==='ok'?run():menu()}
    else if(k==='esc'){menu()}
  }
  $$('.keys button',p).forEach(function(b){b.addEventListener('click',function(){key(b.dataset.k)})});
  p.addEventListener('keydown',function(e){var m={ArrowUp:'up',ArrowDown:'down',Escape:'esc'}[e.key];if(m&&e.target.closest('.keys')){e.preventDefault();key(m)}});
  // power on: the unit runs its self test, then lands on the menu
  if(reduce){menu();return}
  var steps=[['SySTOR','Self test...'],['SySTOR','Self test OK'],['Src: 1  Tgt: 3','Drives ready']],s=0;
  help.textContent='Powering on.';
  (function boot(){if(state!=='boot')return;if(s<steps.length){show(steps[s][0],steps[s][1]);s++;setTimeout(boot,750)}else menu()})();
});

/* ---------- hero product stage ---------- */
$$('[data-stage]').forEach(function(st){
  var tabs=$$('[role=tab]',st),shows=$$('.show',st),i=0,timer;
  function pick(n,focus){i=n;tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===n);t.tabIndex=k===n?0:-1});
    shows.forEach(function(s,k){s.hidden=k!==n});if(focus)tabs[n].focus()}
  tabs.forEach(function(t,n){t.addEventListener('click',function(){stop();pick(n)});
    t.addEventListener('keydown',function(e){var d={ArrowRight:1,ArrowLeft:-1}[e.key];if(d){e.preventDefault();stop();pick((n+d+tabs.length)%tabs.length,true)}})});
  function stop(){clearInterval(timer)}
  if(!reduce){timer=setInterval(function(){pick((i+1)%tabs.length)},5000);st.addEventListener('mouseenter',stop);st.addEventListener('focusin',stop);st.addEventListener('touchstart',stop,{passive:true})}
});

/* ---------- shop by category tabs ---------- */
$$('[data-cbrowse]').forEach(function(cb){
  var tabs=$$('.ct',cb),panels=$$('.cp',cb);
  panels.forEach(function(p){$$('.shop-grid li',p).forEach(function(li,i){li.style.setProperty('--i',i)})});
  function pick(n,focus){tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===n);t.tabIndex=k===n?0:-1});
    panels.forEach(function(p,k){p.hidden=k!==n;p.classList.remove('anim');if(k===n){void p.offsetWidth;p.classList.add('anim')}});
    if(focus)tabs[n].focus()}
  tabs.forEach(function(t,n){t.addEventListener('click',function(){pick(n)});
    t.addEventListener('keydown',function(e){var d={ArrowRight:1,ArrowLeft:-1,ArrowDown:1,ArrowUp:-1}[e.key];if(d){e.preventDefault();pick((n+d+tabs.length)%tabs.length,true)}})});
});

/* ---------- scroll reveals ---------- */
if(!reduce&&'IntersectionObserver' in window){
  document.documentElement.classList.add('js-motion');
  var groups=[
    ['.sec-head,.sub-h,.crumbs',''],
    ['.ct-row','rv-z'],['.cbrowse .cp:not([hidden])',''],['.try-in','rv-z'],['.co-pic','rv-l'],['.co-txt','rv-r'],['.gov-in','rv-z'],
    ['.col-hero-in>div:first-child,.ab-hero-in>div','rv-l'],['.col-hero-img,.ab-photo','rv-r'],
    ['.matrix-wrap,.filters,.feat-g>div,.spec,.panel-row,.prose,.story li,.office,.ct-photo,.two>h2,.two>div:first-child',''],
    ['.gallery','rv-l'],['.buy','rv-r']
  ];
  groups.forEach(function(g){$$(g[0]).forEach(function(el){if(el.closest('.hero,.mm,.drawer'))return;el.classList.add('rv');if(g[1])el.classList.add(g[1])})});
  // cascades: cards in a grid come in one after another
  $$('.co-stats,.grid,.res-g,.range,.stage-pick,.modes-2,.cbrowse .cp:not([hidden]) .shop-grid').forEach(function(list){
    if(list.closest('.hero'))return;
    [].forEach.call(list.children,function(li,i){li.classList.add('rv');li.style.setProperty('--d',(i%6)*70+'ms')});
  });
  var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io2.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  $$('.rv').forEach(function(el){io2.observe(el)});
  // anything still hidden after filtering (hidden cards) shows when it appears again
  addEventListener('change',function(){setTimeout(function(){$$('.rv:not(.in)').forEach(function(el){var r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)el.classList.add('in')})},30)});
  // header shadow and hero product drift
  var heroImg=function(){return $('.show:not([hidden]) .show-img img')},ticking=false;
  addEventListener('scroll',function(){if(ticking)return;ticking=true;requestAnimationFrame(function(){
    var y=scrollY;mast&&mast.classList.toggle('scrolled',y>10);
    var im=heroImg();if(im&&y<900)im.style.transform='translateY('+(y*-0.06).toFixed(1)+'px) rotate('+(y*0.004).toFixed(2)+'deg)';
    ticking=false})},{passive:true});
}

/* ---------- collection filters ---------- */
var ff=$('[data-filters]');
if(ff){
  var grid=$('[data-grid]'),cards=$$('.pc',grid),orig=cards.slice(),cnt=$('[data-count]'),empty=$('.empty');
  function apply(){
    var s=(ff.querySelector('input[name=s]:checked')||{}).value||'',t=ff.t.value,o=ff.o.value,n=0;
    var list=orig.slice();
    if(o==='pa')list.sort(function(a,b){return a.dataset.p-b.dataset.p});
    if(o==='pd')list.sort(function(a,b){return b.dataset.p-a.dataset.p});
    if(o==='t')list.sort(function(a,b){return a.dataset.t-b.dataset.t||a.dataset.p-b.dataset.p});
    list.forEach(function(c){var ok=(!s||c.dataset.s===s)&&(!t||c.dataset.t===t);c.hidden=!ok;if(ok)n++;grid.appendChild(c)});
    cnt.textContent=n;empty.hidden=n>0;
  }
  ff.addEventListener('change',apply);
}

/* ---------- product gallery ---------- */
$$('[data-gallery]').forEach(function(g){
  var main=$('.g-main img',g);
  $$('.g-thumbs button',g).forEach(function(b){b.addEventListener('click',function(){
    main.src=b.dataset.src;$$('.g-thumbs button',g).forEach(function(x){x.removeAttribute('aria-current')});b.setAttribute('aria-current','true')})});
});

/* ---------- buy box ---------- */
var buy=$('[data-buy]');
if(buy){
  var base=555,qty=buy.qty,war=$('[data-warranty]',buy),tot=$('[data-total]',buy),pr=$('[data-price]');
  var fmt=function(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})};
  function upd(){var q=Math.max(1,parseInt(qty.value,10)||1);qty.value=q;var unit=base+(+war.value);pr.textContent=fmt(unit);tot.textContent=fmt(unit*q)}
  $$('[data-q]',buy).forEach(function(b){b.addEventListener('click',function(){qty.value=(parseInt(qty.value,10)||1)+(+b.dataset.q);upd()})});
  buy.addEventListener('change',upd);qty.addEventListener('input',upd);
}

/* ---------- model switcher ---------- */
var sw=$('[data-switch]');
if(sw){
  var models=JSON.parse(sw.dataset.models),out=$('.switch-out',sw);
  var f2=function(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:2})};
  sw.addEventListener('change',function(){
    var t=$('input[name=mt]:checked',sw).value,s=$('input[name=ms]:checked',sw).value,m=models[t+'-'+s];
    if(!m){out.textContent='That combination is not offered.';return}
    if(m[0]==='SYS103HS-DP'){out.textContent='You are viewing this model.';return}
    out.innerHTML='1:'+t+' at '+s+' MB/s is <b>'+m[0]+'</b>, '+f2(m[1])+'. <a href="'+m[3]+'">View this model</a>';
  });
}

/* ---------- product section tabs ---------- */
var tabs=$('[data-tabs]');
if(tabs&&'IntersectionObserver' in window){
  var links=$$('a',tabs),io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-45% 0px -50% 0px'});
  links.forEach(function(a){var s=$(a.getAttribute('href'));s&&io.observe(s)});
}
})();
