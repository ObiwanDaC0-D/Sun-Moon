/* Antipodal Sky Explorer — additive, independent of the main observatory. */
(()=>{'use strict';
const host=document.querySelector('section.panel:has(#phase-name)');
if(!host)return;
const section=document.createElement('section');section.className='panel';section.innerHTML=`
<details id="antipodal-explorer"><summary style="cursor:pointer;font-size:18px;font-weight:650;padding:4px 0">🌐 Antipodal Sky Explorer <span class="muted">· Compare opposite skies</span></summary>
<p class="muted">Compare the same instant at your location and a point on the other side of Earth. Switch to the equatorial mirror to explore seasonal symmetry.</p>
<div class="segment"><button id="anti-mode" aria-pressed="true">Antipode</button><button id="mirror-mode" aria-pressed="false">Equatorial mirror</button></div>
<div class="note"><div id="anti-coordinates"></div><div id="anti-explanation" class="muted" style="margin-top:6px"></div></div>
<div class="muted" style="margin-top:12px">Sun and Moon altitude · synchronized to your selected date and device-local time</div>
<svg id="anti-chart" viewBox="0 0 360 252" role="img" aria-label="Two synchronized altitude graphs showing Sun and Moon at home and the comparison location" style="width:100%;display:block;touch-action:pan-y"></svg>
<label for="anti-hour" class="muted">Time cursor</label><input id="anti-hour" type="range" min="0" max="1440" value="720" step="5" style="width:100%;accent-color:#88d6c8" aria-label="Time of day">
<div id="anti-readout" class="note" aria-live="polite"></div>
<p class="muted">SunCalc analytical estimates. Geometric altitudes use the same instant at both locations; apparent rise/set may differ because of refraction and lunar parallax. Times use your device's time zone, not the comparison location's civil time. No terrain or elevation corrections.</p>
</details>`;
host.before(section);
const el=id=>document.getElementById(id);
let mode='antipode',lastDate='',lastLocation='',lastMode='',samples=null;
const rad=Math.PI/180;
const alt=(t,lat,lon,moon)=>{const pos=moon?SunCalc.getMoonPosition(new Date(t),lat,lon):SunCalc.getPosition(new Date(t),lat,lon);return pos.altitude/rad};
const format=(x,n,p)=>Math.abs(x).toFixed(4)+'° '+(x>=0?p:n);
const coordinates=()=>{const inputs=Array.from(document.querySelectorAll('main .controls input'));const date=el('date').value;let a=38.415,b=-82.445;
const label=el('place').textContent;
const m=label.match(/(-?\d+(?:\.\d+)?)°?\s*,\s*(-?\d+(?:\.\d+)?)°?/);
if(m){a=Number(m[1]);b=Number(m[2])}
else if(label.includes('GPS')&&window.__observatoryGps){[a,b]=window.__observatoryGps}
return {a,b,date,label}};
/* The original app retains lat/lon inside a closure. Capture GPS and coordinate updates
   without modifying its code by observing the displayed coordinates, and fall back to
   the original default when its initial location label is displayed. */
const originalGeo=navigator.geolocation?.getCurrentPosition?.bind(navigator.geolocation);
if(originalGeo){try{navigator.geolocation.getCurrentPosition=function(success,error,opts){return originalGeo(p=>{window.__observatoryGps=[p.coords.latitude,p.coords.longitude];success?.(p)},error,opts)}}catch{}}
function render(){
if(!window.SunCalc){el('anti-readout').textContent='Astronomy library unavailable.';return}
const {a,b,date}=coordinates();if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
const destLat=-a,destLon=mode==='antipode'?((b+360)%360+180)%360-180:b;
el('anti-coordinates').textContent='Home: '+format(a,'S','N')+', '+format(b,'W','E')+'  ·  Comparison: '+format(destLat,'S','N')+', '+format(destLon,'W','E');
el('anti-explanation').textContent=mode==='antipode'?'Antipode: directly opposite through Earth’s center.':'Equatorial mirror: latitude reversed, longitude unchanged.';
const key=[date,a,b,destLon,mode].join('|');
if(key!==lastLocation){const [y,m,d]=date.split('-').map(Number);const start=new Date(y,m-1,d).getTime(),end=new Date(y,m-1,d+1).getTime();samples={start,end,lines:[false,true].flatMap(moon=>[[a,b],[destLat,destLon]].map(([lat,lon])=>Array.from({length:145},(_,i)=>alt(start+(end-start)*i/144,lat,lon,moon))))};lastLocation=key}
const svg=el('anti-chart');svg.replaceChildren();const ns='http://www.w3.org/2000/svg';function node(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!=null)n.textContent=text;svg.append(n);return n}
const x0=42,w=298,h=85,top=[22,135],range=90;
for(let row=0;row<2;row++){node('text',{x:42,y:top[row]-7,fill:'#dce9fa','font-size':12},row===0?'YOUR SKY':'COMPARISON SKY');for(const v of [-90,0,90]){const yy=top[row]+h/2-v/180*h;node('line',{x1:x0,x2:x0+w,y1:yy,y2:yy,stroke:v===0?'#8fa7bd':'#33465f','stroke-dasharray':v===0?'4 3':'none'});node('text',{x:35,y:yy+3,'text-anchor':'end',fill:'#aabbd1','font-size':9},v+'°')}
for(let body=0;body<2;body++){const arr=samples.lines[body*2+row];const points=arr.map((v,i)=>(x0+w*i/144).toFixed(1)+','+(top[row]+h/2-v/180*h).toFixed(1)).join(' ');node('polyline',{points,fill:'none',stroke:body===0?'#f3c77a':'#cbbaff','stroke-width':2})}}
const fraction=Number(el('anti-hour').value)/1440;const x=x0+fraction*w;for(const t of top)node('line',{x1:x,x2:x,y1:t,y2:t+h,stroke:'#88d6c8','stroke-width':1.5});
node('text',{x:42,y:247,fill:'#f3c77a','font-size':10},'━━ Sun');node('text',{x:115,y:247,fill:'#cbbaff','font-size':10},'━━ Moon');
const t=samples.start+(samples.end-samples.start)*fraction;
const stamp=new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
el('anti-readout').textContent=stamp+' · Home: Sun '+alt(t,a,b,false).toFixed(1)+'°, Moon '+alt(t,a,b,true).toFixed(1)+'° · Comparison: Sun '+alt(t,destLat,destLon,false).toFixed(1)+'°, Moon '+alt(t,destLat,destLon,true).toFixed(1)+'°';
}
el('anti-mode').onclick=()=>{mode='antipode';el('anti-mode').setAttribute('aria-pressed','true');el('mirror-mode').setAttribute('aria-pressed','false');render()};
el('mirror-mode').onclick=()=>{mode='mirror';el('anti-mode').setAttribute('aria-pressed','false');el('mirror-mode').setAttribute('aria-pressed','true');render()};
el('anti-hour').addEventListener('input',render);
el('antipodal-explorer').addEventListener('toggle',()=>{if(el('antipodal-explorer').open)render()});
el('date').addEventListener('change',()=>{lastLocation='';render()});
new MutationObserver(()=>{if(el('antipodal-explorer').open)render()}).observe(el('place'),{childList:true,characterData:true,subtree:true});
el('today').addEventListener('click',()=>{lastLocation='';setTimeout(render,0)});
el('forecast').addEventListener('click',()=>{lastLocation='';setTimeout(render,0)});
})();