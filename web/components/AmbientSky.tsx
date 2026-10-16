import {useEffect,useRef} from 'react';
import type {PlayRecord} from '../../shared/contracts';
import {genreColor} from '../genreColor';
const hash=(value:string)=>{let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export const skyIdentity=(r:PlayRecord)=>r.titleKey||`${r.kind}:${r.title}`;

/** Decorative, demand-rendered sky. It never captures input or changes page layout. */
export function AmbientSky({records,enabled}:{records:PlayRecord[];enabled:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const signature=[...new Set(records.map(r=>JSON.stringify([skyIdentity(r),r.genre])))].sort().join('|');
 const orientation=useRef({x:-.12,y:.25});
 useEffect(()=>{
  const element=canvas.current;if(!element||!enabled)return;
  const ctx=element.getContext('2d');if(!ctx)return;
  const titles=[...new Map(records.map(r=>[skyIdentity(r),r])).entries()];
  const point=(seed:number)=>{const y=(seed%10000)/5000-1,a=((seed>>>8)%10000)/10000*Math.PI*2,r=Math.sqrt(1-y*y);return {x:Math.cos(a)*r,y,z:Math.sin(a)*r};};
  const stars=titles.map(([id,r])=>({id,genre:r.genre,color:genreColor(r.genre),...point(hash(id))}));
  const dust=Array.from({length:150},(_,i)=>point(hash('observatory-dust-'+i)));
  let width=0,height=0,frame=0,timer=0,active:string|null=null,light=0,start=0;
  let from={...orientation.current},target={...from},fromLight=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const project=(p:{x:number;y:number;z:number})=>{const o=orientation.current;const a=p.x*Math.cos(o.y)+p.z*Math.sin(o.y),b=-p.x*Math.sin(o.y)+p.z*Math.cos(o.y);const c=p.y*Math.cos(o.x)-b*Math.sin(o.x),z=p.y*Math.sin(o.x)+b*Math.cos(o.x);return {x:width*.96+a*width*.65,y:height*.48+c*height*.65,z};};
  function draw(){
   ctx!.clearRect(0,0,width,height);
   for(const p of dust){const q=project(p);ctx!.fillStyle=`rgba(164,185,213,${.12+(q.z+1)*.12})`;ctx!.beginPath();ctx!.arc(q.x,q.y,.8+(q.z+1)*.35,0,Math.PI*2);ctx!.fill();}
   const selected=stars.find(s=>s.id===active);
   if(selected){const a=project(selected);for(const s of stars.filter(s=>s.id!==active&&s.genre===selected.genre).slice(0,7)){const b=project(s);ctx!.strokeStyle=`rgba(181,196,218,${.18*light})`;ctx!.lineWidth=.85;ctx!.beginPath();ctx!.moveTo(a.x,a.y);ctx!.lineTo(b.x,b.y);ctx!.stroke();}}
   for(const s of stars){const q=project(s),chosen=s.id===active,related=s.genre===selected?.genre;const alpha=.2+(q.z+1)*.16+(related?.24*light:0);ctx!.globalAlpha=alpha;ctx!.fillStyle=s.color;ctx!.beginPath();ctx!.arc(q.x,q.y,chosen?3.2:1.8,0,Math.PI*2);ctx!.fill();if(chosen){ctx!.globalAlpha=.6*light;const glow=ctx!.createRadialGradient(q.x,q.y,0,q.x,q.y,42);glow.addColorStop(0,s.color);glow.addColorStop(1,'transparent');ctx!.fillStyle=glow;ctx!.fillRect(q.x-42,q.y-42,84,84);ctx!.strokeStyle=s.color;ctx!.lineWidth=.8;ctx!.beginPath();ctx!.arc(q.x,q.y,10,0,Math.PI*2);ctx!.stroke();}ctx!.globalAlpha=1;}
  }
  function animate(now:number){const t=Math.min(1,(now-start)/1800),ease=t*t*(3-2*t);orientation.current={x:from.x+(target.x-from.x)*ease,y:from.y+(target.y-from.y)*ease};light=fromLight+(1-fromLight)*ease;draw();if(t<1&&!document.hidden)frame=requestAnimationFrame(animate);}
  function select(id:string){if(id===active)return;const s=stars.find(s=>s.id===id);if(!s)return;cancelAnimationFrame(frame);active=id;light=0;fromLight=0;from={...orientation.current};if(reduced.matches){light=1;draw();return;}const y=-Math.atan2(s.x,s.z),x=Math.atan2(s.y,Math.hypot(s.x,s.z));const delta=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));target={x:from.x+delta(x,from.x),y:from.y+delta(y,from.y)};start=performance.now();frame=requestAnimationFrame(animate);}
  function identity(target:EventTarget|null){if(!(target instanceof Element))return;const card=target.closest('button,a,[data-sky-title]');return card?.getAttribute('data-sky-title')||card?.querySelector('[data-sky-title]')?.getAttribute('data-sky-title');}
  const hover=(e:PointerEvent)=>{if(e.pointerType==='touch')return;clearTimeout(timer);const id=identity(e.target);if(id)timer=window.setTimeout(()=>select(id),180);};
  const focus=(e:FocusEvent)=>{clearTimeout(timer);const id=identity(e.target);if(id)select(id);};
  const click=(e:MouseEvent)=>{clearTimeout(timer);const id=identity(e.target);if(id)select(id);};
  const leave=()=>clearTimeout(timer);
  const resize=()=>{width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);element.width=width*dpr;element.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);clearTimeout(timer);}else draw();};
  const motion=()=>{cancelAnimationFrame(frame);draw();};
  resize();window.addEventListener('resize',resize);document.addEventListener('pointerover',hover);document.addEventListener('pointerout',leave);document.addEventListener('focusin',focus);document.addEventListener('click',click);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);
  return()=>{cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener('resize',resize);document.removeEventListener('pointerover',hover);document.removeEventListener('pointerout',leave);document.removeEventListener('focusin',focus);document.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);};
 },[signature,enabled]);
 return <div className={`ambient-sky ${enabled?'is-visible':''}`} aria-hidden="true"><canvas ref={canvas}/></div>;
}
