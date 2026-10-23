(() => {
  'use strict';
  const DATA=window.MENU_DATA;
  const source=document.getElementById('menu-pages');
  const allSlides=[];
  let activeIndex=0;
  let currentPrices={};
  const cloudEnabled=Boolean(window.FETININ_FIREBASE_CONFIG?.apiKey && window.FETININ_FIREBASE_CONFIG?.projectId);
  if(!cloudEnabled){try{currentPrices=JSON.parse(localStorage.getItem('fetinin_demo_prices') || '{}')||{};}catch{currentPrices={};}}
  function pct(n,total){return (100*n/total).toFixed(5)+'%';}
  function addHotspot(parent,{x,y,w,h,label,href,click}){
    const e=document.createElement(href?'a':'button');
    e.className='hotspot';e.setAttribute('aria-label',label);
    e.style.left=pct(x,1024);e.style.top=pct(y,1536);
    e.style.width=pct(w,1024);e.style.height=pct(h,1536);
    if(href){e.href=href;if(href.startsWith('https://')){e.target='_blank';e.rel='noopener noreferrer';}}
    else{e.type='button';e.addEventListener('click',click);}
    parent.appendChild(e);
  }
  function frameFor(image,id,title){
    const div=document.createElement('div');div.className='frame';div.dataset.pageId=id;
    const img=document.createElement('img');img.src=image;img.alt=title;
    img.width=1024;img.height=1536;img.loading=id==='cover'?'eager':'lazy';
    img.decoding='async';div.appendChild(img);return div;
  }
  function addSlide(id,title,image){
    const section=document.createElement('section');section.className='slide';section.dataset.slideId=id;
    const frame=frameFor(image,id,title);section.appendChild(frame);source.appendChild(section);
    allSlides.push({section,frame,title,id});return frame;
  }
  function go(i){const index=Math.max(0,Math.min(allSlides.length-1,i));allSlides[index].section.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('category-drawer').hidden=true;}
  function goToId(id){const index=allSlides.findIndex(x=>x.id===id);if(index>=0)go(index);}
  const cover=addSlide('cover','Hoş geldiniz','assets/cover.png');
  const cards=[
    {x:21,y:1050,w:185,h:161,label:'Kebap Çeşitleri',dest:'m01'},
    {x:215,y:1050,w:187,h:161,label:'Dürüm Çeşitleri',dest:'m01'},
    {x:410,y:1050,w:187,h:161,label:'Pide ve Lahmacun',dest:'m06'},
    {x:606,y:1050,w:190,h:161,label:'Pizza Çeşitleri',dest:'m05'},
    {x:808,y:1050,w:192,h:161,label:'Izgara Çeşitleri',dest:'m07'},
    {x:21,y:1220,w:185,h:180,label:'Çorba Çeşitleri',dest:'m02'},
    {x:215,y:1220,w:187,h:180,label:'Makarna Çeşitleri',dest:'m03'},
    {x:410,y:1220,w:187,h:180,label:'Kahvaltı Çeşitleri',dest:'m04'},
    {x:606,y:1220,w:190,h:180,label:'Fast Food Çeşitleri',dest:'m08'},
    {x:808,y:1220,w:192,h:180,label:'İçecek Çeşitleri',dest:'m10'},
  ];
  cards.forEach(c=>addHotspot(cover,{...c,click:()=>goToId(c.dest)}));
  DATA.pages.forEach(pg=>{
    const f=addSlide(pg.id,pg.title,pg.image);
    const b=document.createElement('button');b.className='page-zoom';b.textContent='⌕ Büyüt';b.type='button';b.addEventListener('click',()=>showZoom(f));f.appendChild(b);
  });
  const contact=addSlide('contact','İletişim','assets/contact.png');
  addHotspot(contact,{x:240,y:560,w:545,h:122,label:'Telefonla ara',href:DATA.telHref});
  addHotspot(contact,{x:240,y:701,w:545,h:127,label:'Instagram profilini aç',href:DATA.instagramHref});
  addHotspot(contact,{x:240,y:845,w:545,h:130,label:'Haritalarda adresi aç',href:DATA.mapsHref});
  addHotspot(contact,{x:366,y:995,w:305,h:277,label:'QR koduyla konumu aç',href:DATA.mapsHref});
  const jump=document.getElementById('category-links');
  [{id:'cover',title:'Giriş'},...DATA.pages.map(({id,title})=>({id,title})),{id:'contact',title:'İletişim'}].forEach(x=>{
    const b=document.createElement('button');b.type='button';b.textContent=x.title;b.addEventListener('click',()=>goToId(x.id));jump.appendChild(b);
  });
  const drawer=document.getElementById('category-drawer');
  document.getElementById('categories-button').addEventListener('click',()=>drawer.hidden=!drawer.hidden);
  document.getElementById('close-drawer').addEventListener('click',()=>drawer.hidden=true);
  document.getElementById('next').addEventListener('click',()=>go(activeIndex+1));
  document.getElementById('prev').addEventListener('click',()=>go(activeIndex-1));
  const observer=new IntersectionObserver(entries=>{
    entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio).forEach(e=>{
      const index=allSlides.findIndex(p=>p.section===e.target);if(index<0)return;
      activeIndex=index;
      document.getElementById('current-title').textContent=allSlides[index].title;
      document.getElementById('page-counter').textContent=(index+1)+' / '+allSlides.length;
    });
  },{root:source,threshold:[.51,.75]});
  allSlides.forEach(x=>observer.observe(x.section));
  // Overlay only edited prices. Unchanged badges remain the owner's approved artwork pixel-for-pixel.
  function paintPrices(){
    document.querySelectorAll('.frame[data-page-id^="m"]').forEach(frame=>{
      frame.querySelectorAll('.price-cover').forEach(x=>x.remove());
      const pg=DATA.pages.find(p=>p.id===frame.dataset.pageId);if(!pg)return;
      pg.items.forEach(item=>{
        const price=currentPrices[item.id];if(price===undefined||Number(price)===Number(item.price))return;
        const b=item.box;
        const chip=document.createElement('span');chip.className='price-cover';
        const text=Number(price).toLocaleString('tr-TR')+' TL';
        const w=Math.max(b.w, Math.ceil((text.length*0.51+1.1)*b.h*0.56));
        const x=b.x+b.w-w;
        chip.style.left=pct(x,1024);chip.style.top=pct(b.y,1536);
        chip.style.width=pct(w,1024);chip.style.height=pct(b.h,1536);
        // Match the visual height of the white price lettering in the approved menu image.
        // Work in 1024px artwork coordinates; fit long amounts without clipping the blue badge.
        const canvas=paintPrices.measureCanvas||(paintPrices.measureCanvas=document.createElement('canvas'));
        const ctx=canvas.getContext('2d');
        let size=b.h*0.82;
        ctx.font=`800 ${size}px Arial`;
        const available=Math.max(1,w-Math.max(6,b.h*0.27));
        const needed=ctx.measureText(text).width;
        if(needed>available)size*=available/needed;
        chip.style.fontSize=(size/1024*100).toFixed(4)+'cqw';
        chip.textContent=text;chip.setAttribute('aria-label',item.name+': '+text);
        frame.appendChild(chip);
      });
    });
  }
  paintPrices();
  const zoom=document.getElementById('zoom-dialog');
  function showZoom(orig){
    const clone=orig.cloneNode(true);clone.querySelector('.page-zoom')?.remove();
    clone.querySelectorAll('.hotspot').forEach(a=>a.remove());
    const z=document.getElementById('zoom-content');z.replaceChildren(clone);
    zoom.showModal();
  }
  document.getElementById('close-zoom').addEventListener('click',()=>zoom.close());
  zoom.addEventListener('click',e=>{if(e.target===zoom)zoom.close();});
  window.addEventListener('storage',e=>{if(!cloudEnabled&&e.key==='fetinin_demo_prices'){
    try{currentPrices=JSON.parse(e.newValue||'{}')||{};}catch{currentPrices={};}paintPrices();
  }});
  if(cloudEnabled){
    (async()=>{
      try{
        const [fa,fs]=await Promise.all([
          import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
        ]);
        const fb=fa.initializeApp(window.FETININ_FIREBASE_CONFIG);
        fs.onSnapshot(fs.doc(fs.getFirestore(fb),'menus','fetinin-yeri'), snap=>{
          currentPrices=(snap.data()?.prices)||{};paintPrices();
        },err=>{console.error('Fiyat sunucusuna ulaşılamadı:',err);});
      }catch(err){console.error('Firebase başlatılamadı:',err);}
    })();
  }
  // direct navigation from QR menu links, e.g. index.html#pizza
  const shorthand={kebap:'m01',durum:'m01',corba:'m02',makarna:'m03',kahvalti:'m04',pizza:'m05',pide:'m06',izgara:'m07',salata:'m08',sicak:'m09',soguk:'m10',iletisim:'contact'};
  const key=location.hash.replace('#','').toLowerCase();if(shorthand[key])setTimeout(()=>goToId(shorthand[key]),240);
})();
