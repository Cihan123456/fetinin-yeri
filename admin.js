(async()=>{
 'use strict';
 const DATA=window.MENU_DATA;
 const configured=Boolean(window.FETININ_FIREBASE_CONFIG?.apiKey&&window.FETININ_FIREBASE_CONFIG?.projectId);
 const banner=document.getElementById('status-banner');
 const editor=document.getElementById('editor-section');
 const setup=document.getElementById('setup-notice');
 const login=document.getElementById('login-section');
 const ownerUid=window.FETININ_OWNER_UID||'';
 let user=null,db=null,fs=null,auth=null,authModule=null,prices={},mode='demo';
 const inputs=new Map();
 const originals={};
 DATA.pages.forEach(p=>p.items.forEach(i=>originals[i.id]=i.price));
 try{prices=JSON.parse(localStorage.getItem('fetinin_demo_prices')||'{}')||{};}catch{prices={};}
 function setStatus(s){banner.textContent=s;}
 function buildEditor(){
  const target=document.getElementById('price-groups');target.replaceChildren();inputs.clear();
  DATA.pages.forEach(pg=>{
   const group=document.createElement('section');group.className='group';
   const heading=document.createElement('h2');heading.textContent=pg.title;group.appendChild(heading);
   pg.items.forEach(item=>{
     const row=document.createElement('div');row.className='price-row';
     const label=document.createElement('label');label.textContent=item.name;label.htmlFor=item.id;
     const field=document.createElement('input');field.id=item.id;field.type='number';field.min='0';field.max='100000';field.step='1';
     field.inputMode='numeric';field.value=(prices[item.id]??item.price);
     field.addEventListener('input',()=>row.classList.toggle('changed',Number(field.value)!==Number(item.price)));
     if(Number(field.value)!==Number(item.price))row.classList.add('changed');
     const currency=document.createElement('small');currency.textContent='TL';
     row.append(label,field,currency);group.appendChild(row);inputs.set(item.id,field);
   });target.appendChild(group);
  });
 }
 function collect(){
   const next={};for(const [key,element] of inputs){
     if(!/^\d{1,6}$/.test(element.value))throw new Error('Tüm fiyatlar 0–100000 aralığında tam sayı olmalı.');
     next[key]=Number(element.value);
   }return next;
 }
 async function saveAll(){
   const msg=document.getElementById('save-message');
   try{
    const next=collect();
    if(mode==='firebase'){
      if(!auth.currentUser||auth.currentUser.uid!==ownerUid)throw new Error('Yetkili giriş gerekli.');
      await fs.setDoc(fs.doc(db,'menus','fetinin-yeri'),{prices:next,updatedAt:fs.serverTimestamp()},{merge:true});
      msg.textContent='Kaydedildi! Fiyatlar müşterilerin menüsüne yansır.';
    }else{
      localStorage.setItem('fetinin_demo_prices',JSON.stringify(next));
      msg.textContent='Bu cihaz için deneme kaydedildi. Diğer telefonlarda değişmez.';
    }
    prices=next;setTimeout(()=>{msg.textContent='';},6500);
   }catch(e){msg.textContent='Kaydedilemedi: '+e.message;}
 }
 document.getElementById('save-all').addEventListener('click',saveAll);
 document.getElementById('save-bottom').addEventListener('click',saveAll);
 function startDemo(){mode='demo';setup.hidden=true;editor.hidden=false;buildEditor();setStatus('DENEME — Fiyat değişiklikleri yalnızca bu tarayıcıda görünür. Canlı yayın için Firebase bağlantısı gerekir.');}
 document.getElementById('demo-button').addEventListener('click',startDemo);
 if(!configured){setStatus('Canlı fiyat güncelleme bağlantısı henüz kurulmadı.');setup.hidden=false;return;}
 setStatus('Güvenli fiyat yönetimi bağlantısı hazırlanıyor…');
 try{
   const [fa,fb,ff]=await Promise.all([
     import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
     import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
     import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')]);
   fs=ff;authModule=fb;
   const application=fa.initializeApp(window.FETININ_FIREBASE_CONFIG);auth=fb.getAuth(application);db=ff.getFirestore(application);
   login.hidden=false;setStatus('İşletme sahibi girişi bekleniyor.');
   fb.onAuthStateChanged(auth,async u=>{
     if(!u){user=null;login.hidden=false;editor.hidden=true;return;}
     if(!ownerUid||u.uid!==ownerUid){setStatus('Bu hesap fiyat değiştirmeye yetkili değil.');await fb.signOut(auth);return;}
     user=u;login.hidden=true;editor.hidden=false;mode='firebase';
     setStatus('Canlı yönetim açık — yeni fiyatlar tüm müşterilere yansır.');
     document.getElementById('logout').hidden=false;
     try{
       const snap=await ff.getDoc(ff.doc(db,'menus','fetinin-yeri'));
       prices=snap.data()?.prices||{};
     }catch(e){console.error(e);}
     buildEditor();
   });
   document.getElementById('login-form').addEventListener('submit',async event=>{
     event.preventDefault();setStatus('Giriş yapılıyor…');
     try{await fb.signInWithEmailAndPassword(auth,document.getElementById('email').value,document.getElementById('password').value);}
     catch(e){setStatus('Giriş başarısız: '+e.message);}
   });
   document.getElementById('logout').addEventListener('click',()=>fb.signOut(auth));
 }catch(e){setStatus('Sunucu bağlantısı açılamadı: '+e.message);setup.hidden=false;}
})();
