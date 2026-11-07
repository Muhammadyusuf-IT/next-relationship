const $=id=>document.getElementById(id);
const fields=[{name:'Yosh',min:10,max:100,unit:' yosh'},{name:'Bo‘y',min:100,max:300,unit:' sm'},{name:'Kasb',values:['Dasturchi','Shifokor','O‘qituvchi','Tadbirkor','Oshpaz','Sportchi','Dizayner','Qo‘shiqchi','Uchuvchi','Bloger']},{name:'Jins',values:['Erkak','Ayol']},{name:'Xarakter',values:['Romantik','Mehribon','Jahldor','Quvnoq','Sodiq','G‘amxo‘r','Uyatchan','Jasur','Sabrli','Hazilkash','Jiddiy','Samimiy','Rashkchi','Ochiqko‘ngil','Kamtar','Qaysar','Xotirjam','Saxiy']},{name:'Sevimli mashg‘ulot',values:['Kitob o‘qish','Musiqa tinglash','Sayohat','Futbol','Raqs','Rasm chizish','Ovqat pishirish','O‘yin o‘ynash','Kino ko‘rish','Suzish','Qo‘shiq aytish','Suratga olish']}];
const fieldOrder=['Jins','Yosh','Kasb','Bo‘y','Xarakter','Sevimli mashg‘ulot'];
fields.sort((a,b)=>fieldOrder.indexOf(a.name)-fieldOrder.indexOf(b.name));
let stream=null,running=false,runId=0,results=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function pick(f){return f.values?f.values[Math.floor(Math.random()*f.values.length)]:Math.floor(Math.random()*(f.max-f.min+1))+f.min+f.unit}
function screen(name){for(const id of ['intro','game','result'])$(id).hidden=id!==name}
let noticeTimer;function notice(text){$('notice').textContent=text;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,6500)}
function stopCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('camera').srcObject=null;$('cameraToggle').setAttribute('aria-pressed','false')}
async function startCamera(){if(stream&&stream.getVideoTracks().some(t=>t.readyState==='live'))return true;try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('unsupported');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});$('camera').srcObject=stream;await $('camera').play();$('cameraToggle').setAttribute('aria-pressed','true');return true}catch(error){stopCamera();notice(error.name==='NotAllowedError'?copy[language].denied:error.name==='NotFoundError'?copy[language].missing:copy[language].error);return false}}
function makeTrack(){
 const vertical=matchMedia('(max-width:600px)').matches,spacing=vertical?150:240;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const travelMs=5000;
 $('track').innerHTML='';$('track').style.setProperty('--travel-time',travelMs+'ms');
 const point=i=>({x:vertical?0:i*spacing,y:vertical?i*spacing:(i%2?-26:14)});
 const origin=point(-1),startDot=document.createElement('span');startDot.className='start-dot';startDot.style.left=origin.x+'px';startDot.style.top=origin.y+11+'px';$('track').append(startDot);
 fields.forEach((f,i)=>{
  const p=point(i),previous=point(i-1),dx=p.x-previous.x,dy=p.y-previous.y;
  const line=document.createElement('div');line.className='line';line.style.left=previous.x+'px';line.style.top=previous.y+11+'px';line.style.width=Math.hypot(dx,dy)+'px';line.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';
  line.innerHTML='<span class="line-fill"></span>';$('track').append(line);
  const node=document.createElement('div');node.className='node';node.style.left=p.x+'px';node.style.top=p.y+'px';node.innerHTML='<div class="label"></div><span class="dot"></span><div class="value">?</div>';node.querySelector('.label').textContent=t(f.name);$('track').append(node);
 });return {spacing,vertical,travelMs};
}
async function play(){if(running)return;running=true;const token=++runId;results=fields.map(pick);$('language').disabled=true;screen('game');$('status').textContent='';$('counter').textContent='00 / 06';$('progress').style.width='0%';const {spacing,vertical,travelMs}=makeTrack();const axis=vertical?'Y':'X';$('track').style.transition='none';$('track').style.transform=`translate${axis}(${spacing}px)`;await delay(600);if(token!==runId)return;$('track').style.transition='transform 1200ms ease-in-out';const nodes=[...document.querySelectorAll('.node')];for(let i=0;i<fields.length;i++){if(token!==runId)return;$('counter').textContent=`0${i+1} / 06`;$('status').textContent=t(fields[i].name);const segment=document.querySelectorAll('.line')[i];segment.classList.add('traveling');const fill=segment.querySelector('.line-fill');const charging=fill.animate([{width:'0%'},{width:'100%'}],{duration:travelMs,easing:'linear',fill:'forwards'});await charging.finished;if(token!==runId)return;segment.classList.add('arrived');nodes[i].classList.add('active');await delay(400);if(token!==runId)return;const value=results[i];nodes[i].querySelector('.value').textContent=displayValue(value);$('status').textContent=t(fields[i].name)+': '+displayValue(value);$('progress').style.width=((i+1)/fields.length*100)+'%';await delay(2000);if(token!==runId)return;$('track').style.transform=`translate${axis}(${-i*spacing}px)`;await delay(1250);if(token!==runId)return;nodes[i].classList.remove('active');nodes[i].classList.add('done')}await delay(600);if(token!==runId)return;$('resultGrid').innerHTML='';fields.forEach((f,i)=>{const card=document.createElement('div');card.className='card';const label=document.createElement('small');label.textContent=t(f.name);const value=document.createElement('strong');value.textContent=displayValue(results[i]);card.append(label,value);$('resultGrid').append(card)});running=false;$('language').disabled=false;screen('result')}
$('start').onclick=async()=>{$('start').disabled=true;try{if(await startCamera())await play()}finally{$('start').disabled=false}};$('demo').onclick=()=>play();$('again').onclick=()=>play();$('home').onclick=()=>{runId++;running=false;screen('intro')};$('cameraToggle').onclick=async()=>{if(stream)stopCamera();else await startCamera()};window.addEventListener('pagehide',()=>{runId++;running=false;stopCamera()});window.addEventListener('pageshow',event=>{if(event.persisted)screen('intro')});

$('language').onchange=()=>{language=$('language').value;try{localStorage.setItem('next-language',language)}catch{}localize()};localize();

$('retry').onclick=()=>{runId++;running=false;void play()};
