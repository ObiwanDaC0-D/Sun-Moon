/* Earth day/night visualizer: independent enhancement for the Antipodal Sky Explorer. */
(()=>{'use strict';
const explorer=document.getElementById('antipodal-explorer');if(!explorer)return;
const panel=document.createElement('div');panel.className='note';panel.style.margin='12px 0';
panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><strong style="color:#88d6c8">Earth · Day & Night</strong><button type="button" id="earth-play" aria-pressed="false">▶ Play day</button></div><p class="muted" style="margin:5px 0">The illuminated hemisphere follows the Sun. The teal marker is your location; the amber marker is the comparison point. The globe is centered on your location.</p><canvas id="earth-globe" width="320" height="320" role="img" aria-label="Animated globe showing Earth's day-night boundary and locations" style="display:block;width:min(100%,320px);height:auto;margin:0 auto"></canvas><div id="earth-caption" class="muted" style="text-align:center"></div><div class="muted">Schematic spherical Earth; approximate solar illumination. This globe is not a satellite image or a weather visualization.</div>';
const chart=document.getElementById('anti-chart');chart.before(panel);
const canvas=document.getElementById('earth-globe'),ctx=canvas.getContext('2d',{alpha:false}),play=document.getElementById('earth-play'),slider=document.getElementById('anti-hour');
let running=false,raf=0,last=0;
const deg=Math.PI/180, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const vec=(lat,lon)=>[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];
const coords=()=>{const l=window.__observatoryLocation;if(l)return [l.lat,l.lon];const label=document.getElementById('place').textContent;const m=label.match(/(-?\d+(?:\.\d+)?)°?\s*,\s*(-?\d+(?:\.\d+)?)°?/);return m?[+m[1],+m[2]]:[38.415,-82.445]};
function sunVector(time){const p=SunCalc.getPosition(new Date(time),0,0),a=p.azimuth,h=p.altitude;return [Math.sin(h),-Math.sin(a)*Math.cos(h),-Math.cos(a)*Math.cos(h)]}
function render(){
if(!explorer.open||!window.SunCalc)return;
const [lat,lon]=coords(),date=document.getElementById('date').value;
if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
const [y,m,d]=date.split('-').map(Number),start=new Date(y,m-1,d).getTime(),end=new Date(y,m-1,d+1).getTime(),t=start+(end-start)*Number(slider.value)/1440;
const phi=lat*deg,lambda=lon*deg,n=vec(phi,lambda),east=[-Math.sin(lambda),Math.cos(lambda),0],north=[-Math.sin(phi)*Math.cos(lambda),-Math.sin(phi)*Math.sin(lambda),Math.cos(phi)],sun=sunVector(t);
const size=320,r=139,c=size/2,img=ctx.createImageData(size,size),pixels=img.data;
for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++){
const k=(yy*size+xx)*4,u=(xx-c)/r,v=(c-yy)/r,q=u*u+v*v;
if(q>1){pixels[k]=13;pixels[k+1]=26;pixels[k+2]=44;pixels[k+3]=255;continue}
const z=Math.sqrt(1-q),point=[n[0]*z+east[0]*u+north[0]*v,n[1]*z+east[1]*u+north[1]*v,n[2]*z+east[2]*u+north[2]*v],light=dot(point,sun),illum=Math.max(0,light),twilight=Math.max(0,1-Math.abs(light)*18),edge=.75+.25*z;
const gridLat=Math.asin(Math.max(-1,Math.min(1,point[2])))/deg,gridLon=Math.atan2(point[1],point[0])/deg;
const grid=(Math.abs(gridLat/15-Math.round(gridLat/15))<.022||Math.abs(gridLon/15-Math.round(gridLon/15))<.022)?10:0;
pixels[k]=Math.min(255,(light>0?26+illum*35:9)+twilight*24+grid)*edge;
pixels[k+1]=Math.min(255,(light>0?80+illum*75:30)+twilight*20+grid)*edge;
pixels[k+2]=Math.min(255,(light>0?120+illum*95:60)+twilight*12+grid)*edge;
pixels[k+3]=255;
}
ctx.putImageData(img,0,0);ctx.strokeStyle='#789cb9';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(c,c,r,0,2*Math.PI);ctx.stroke();
function marker(point,color,label){const visible=dot(point,n),u=dot(point,east),v=dot(point,north);if(visible<-.001)return;const x=c+r*u,y=c-r*v;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();ctx.font='12px system-ui';ctx.fillStyle='#f0f5ff';ctx.textAlign='center';ctx.fillText(label,x,Math.max(12,y-12))}
marker(n,'#88d6c8','Home');
const mode=document.getElementById('mirror-mode').getAttribute('aria-pressed')==='true';
const other=vec(-phi,mode?lambda:lambda+Math.PI);marker(other,'#f3c77a',mode?'Mirror':'Antipode');
const homeSun=dot(n,sun);
document.getElementById('earth-caption').textContent=new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+' · Home: '+(homeSun>0?'Sun above geometric horizon':'Sun below geometric horizon')+(mode?' · Equatorial mirror':' · Antipode on far side');
}
function tick(now){if(!running)return;if(!explorer.open){stop();return}if(!last)last=now;const delta=Math.min(80,now-last);last=now;slider.value=(Number(slider.value)+delta*0.012)%1440;slider.dispatchEvent(new Event('input',{bubbles:true}));render();raf=requestAnimationFrame(tick)}
function stop(){running=false;cancelAnimationFrame(raf);raf=0;last=0;play.textContent='▶ Play day';play.setAttribute('aria-pressed','false')}
play.addEventListener('click',()=>{if(running){stop();return}running=true;play.textContent='❚❚ Pause';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick)});
slider.addEventListener('input',render);
document.getElementById('date').addEventListener('change',render);
window.addEventListener('observatory:location',render);
for(const id of ['anti-mode','mirror-mode'])document.getElementById(id).addEventListener('click',render);
explorer.addEventListener('toggle',()=>{if(explorer.open)render();else stop()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
})();