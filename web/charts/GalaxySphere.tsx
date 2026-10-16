import {useRef,useState,useEffect} from 'react';
// Smooth depth blend over a broad band around the sphere's horizon.
const frontness=(z:number)=>{const t=Math.max(0,Math.min(1,(z+65)/130));return t*t*(3-2*t);};
type Galaxy={name:string;color:string;count:number;titles:{id:string;title:string;groups:unknown[]}[]};
export function GalaxySphere({galaxies,selected,selectedTitle,resetVersion,onGenre,onTitle}:{resetVersion:number;galaxies:Galaxy[];selected?:string;selectedTitle?:string;onGenre:(name:string)=>void;onTitle:(genre:string,id:string)=>void}){
 const [rotation,setRotation]=useState({x:-.2,y:.3});useEffect(()=>setRotation({x:-.2,y:.3}),[resetVersion]);
 const svg=useRef<SVGSVGElement>(null);const [hitRadius,setHitRadius]=useState(22);
 const drag=useRef<{x:number;y:number;distance:number}|null>(null);const moved=useRef(false);
 useEffect(()=>{const el=svg.current;if(!el)return;const observer=new ResizeObserver(()=>{const rect=el.getBoundingClientRect();const scale=Math.min(rect.width/480,rect.height/430);setHitRadius(22/Math.max(.1,scale));});observer.observe(el);return()=>observer.disconnect();},[]);
 function rotate(dx:number,dy:number){setRotation(r=>({x:r.x+dy,y:r.y+dx}));}
 function project(p:number[]){const [x,y,z]=p;const a=x*Math.cos(rotation.y)+z*Math.sin(rotation.y),b=-x*Math.sin(rotation.y)+z*Math.cos(rotation.y);const c=y*Math.cos(rotation.x)-b*Math.sin(rotation.x),d=y*Math.sin(rotation.x)+b*Math.cos(rotation.x);const scale=440/(440-d);return {x:240+a*scale,y:212+c*scale,z:d,scale};}
 const centers=galaxies.map((g,i)=>{const y=1-2*(i+.5)/galaxies.length;const a=i*2.399963;const r=Math.sqrt(1-y*y);return {g,p:[Math.cos(a)*r*137,y*137,Math.sin(a)*r*137]};});
 const stars=centers.flatMap(({g,p})=>{const n=p.map(v=>v/137);const u=[-n[2],0,n[0]];const len=Math.hypot(...u)||1;const tangent=u.map(v=>v/len);const v=[n[1]*tangent[2]-n[2]*tangent[1],n[2]*tangent[0]-n[0]*tangent[2],n[0]*tangent[1]-n[1]*tangent[0]];return g.titles.map((t,j)=>{const angle=j*2.399963,radius=g.titles.length===1?0:Math.sqrt((j+.4)/g.titles.length)*38;const point=p.map((value,k)=>value+radius*(Math.cos(angle)*tangent[k]+Math.sin(angle)*v[k]));return {g,t,point,...project(point)};});}).sort((a,b)=>a.z-b.z);
 const ring=(axis:number,front:boolean)=>{
  let wasVisible=false;return Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;const p=axis===0?[Math.cos(a)*155,0,Math.sin(a)*155]:axis===1?[0,Math.cos(a)*155,Math.sin(a)*155]:[Math.cos(a)*155,Math.sin(a)*155,0];const q=project(p);const visible=front?q.z>=0:q.z<0;const segment=visible?`${wasVisible?'L':'M'}${q.x},${q.y}`:'';wasVisible=visible;return segment;}).join(' ');
 };

 const labelPositions:{x:number;y:number}[]=[];
 const labels=[...centers].sort((a,b)=>(b.g.name===selected?1:0)-(a.g.name===selected?1:0)||project(b.p).z-project(a.p).z).filter(({g,p})=>{const q=project(p);if(q.z<-15&&g.name!==selected)return false;const y=q.y+36*q.scale;if(labelPositions.some(v=>Math.abs(v.x-q.x)<105&&Math.abs(v.y-y)<35))return false;labelPositions.push({x:q.x,y});return true;});
 return <div className="galaxy-sphere">
 <svg ref={svg} viewBox="0 0 480 430" className="sphere-canvas" tabIndex={0} role="group" aria-label="Rotatable genre galaxy. Drag to rotate. Hover over or select a star for title details."
 onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,distance:0};moved.current=false;}}
 onPointerMove={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;drag.current.distance+=Math.abs(dx)+Math.abs(dy);if(drag.current.distance>4){moved.current=true;if(!e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);}drag.current.x=e.clientX;drag.current.y=e.clientY;rotate(dx*.008,-dy*.008);}}
 onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onPointerCancel={()=>{drag.current=null;}} onPointerLeave={()=>{if(!moved.current)drag.current=null;}}
 >
 <defs><radialGradient id="sphere-nebula"><stop offset="0" stopColor="#78aaa6" stopOpacity=".13"/><stop offset=".7" stopColor="#7b8c85" stopOpacity=".045"/><stop offset="1" stopColor="#0d1420" stopOpacity="0"/></radialGradient><filter id="sphere-glow"><feGaussianBlur stdDeviation="3"/></filter></defs>
 <circle cx="240" cy="212" r="205" fill="url(#sphere-nebula)"/>
 {Array.from({length:55},(_,i)=><circle key={i} cx={12+(i*137.51)%456} cy={15+(i*83.17)%400} r={i%5===0?1:.55} fill="#c4cfcc" opacity={.1+(i%4)*.045} pointerEvents="none"/>)}
 <circle cx="240" cy="212" r="166" fill="#101d2b" fillOpacity=".45" stroke="#a9bdb0" strokeOpacity=".3" pointerEvents="none"/>
 {[0,1,2].map(axis=><path key={axis} d={ring(axis,false)} fill="none" stroke="#92aca4" strokeOpacity=".13" strokeDasharray="2 6" pointerEvents="none"/>)}
 {[0,1,2].map(axis=><path key={axis} d={ring(axis,true)} fill="none" stroke="#adc8bb" strokeOpacity=".48" strokeWidth="1.2" pointerEvents="none"/>)}

 {centers.map(({g,p})=>{const center=project(p);return <g key={g.name} pointerEvents="none">{stars.filter(s=>s.g.name===g.name).map(s=><line key={s.t.id} x1={center.x} y1={center.y} x2={s.x} y2={s.y} stroke={g.color} strokeOpacity={g.name===selected?'.35':'.12'}/>)}<circle cx={center.x} cy={center.y} r={28*center.scale} fill={g.color} opacity={.025+.03*frontness(center.z)} filter="url(#sphere-glow)"/></g>;})}
 {stars.map(s=><g key={s.t.id} className="sphere-star" role="button" aria-pressed={s.t.id===selectedTitle} tabIndex={0} aria-label={`${s.t.title}, ${s.g.name}, ${s.t.groups.length} grouped watched entries`} onPointerEnter={e=>{if(e.pointerType!=='touch'&&e.buttons===0&&!drag.current)onTitle(s.g.name,s.t.id);}} onClick={()=>{if(!moved.current)onTitle(s.g.name,s.t.id);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTitle(s.g.name,s.t.id);}}} opacity={s.t.id===selectedTitle?1:.22+.78*frontness(s.z)}>
 <circle cx={s.x} cy={s.y} r={hitRadius} fill="transparent"/><circle cx={s.x} cy={s.y} r={(3+Math.min(5,Math.sqrt(s.t.groups.length)))*s.scale} fill={s.g.color} fillOpacity={frontness(s.z)} stroke={s.g.color} strokeWidth={1-frontness(s.z)}/><circle cx={s.x-1} cy={s.y-1} r={1.2*s.scale} opacity={frontness(s.z)} fill="#fff" pointerEvents="none"/>{s.t.id===selectedTitle&&<circle cx={s.x} cy={s.y} r={12*s.scale} fill="none" stroke="#f0e7d8" strokeWidth="1.2" pointerEvents="none"/>}<title>{s.t.title} · {s.g.name} · {s.t.groups.length} entries</title></g>)}
 {labels.map(({g,p})=>{const q=project(p);return <g key={g.name} role="button" tabIndex={0} className="sphere-label" aria-label={`${g.name}, ${g.count} grouped watched entries`} onClick={()=>{if(!moved.current)onGenre(g.name);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onGenre(g.name);}}} opacity={g.name===selected?1:.24+.76*frontness(q.z)}><text x={q.x} y={q.y+36*q.scale} textAnchor="middle" fill={g.color}>{g.name}</text><text className="sphere-label-count" x={q.x} y={q.y+49*q.scale} textAnchor="middle">{g.count} entries</text></g>;})}
 </svg></div>;
}
