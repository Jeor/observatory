import {orbitStep} from './orbit';
import {Artwork} from '../components/Artwork';
import type {PlayRecord} from '../../shared/contracts';
import {useRef,useState,useEffect,useMemo} from 'react';
export function ClearLogo({record}:{record:PlayRecord}){const [failed,setFailed]=useState<string|null>(null);return record.logo&&record.logo!==failed?<img src={record.logo} alt={record.title} onError={()=>setFailed(record.logo||null)}/>:<span>{record.title}</span>;}
// Depth gently dims the far side of the galactic disk.
const frontness=(z:number)=>{const t=Math.max(0,Math.min(1,(z+65)/130));return t*t*(3-2*t);};
type Galaxy={name:string;color:string;count:number;titles:{id:string;title:string;groups:unknown[];latest:PlayRecord}[]};
export function GalaxySphere({galaxies,selected,selectedTitle,resetVersion,onGenre,onTitle,onPreview,detailOpen}:{detailOpen:boolean;resetVersion:number;galaxies:Galaxy[];selected?:string;selectedTitle?:string;onPreview:(genre:string,id:string)=>void;onGenre:(name:string)=>void;onTitle:(genre:string,id:string)=>void}){
 const [rotation,setRotation]=useState({x:-.2,y:.3});const [zoom,setZoom]=useState(1.45);const animation=useRef<number>(0);const rotationRef=useRef(rotation);rotationRef.current=rotation;const dragTarget=useRef(rotation);const draggingFrame=useRef(false);
 useEffect(()=>{cancelAnimationFrame(animation.current);draggingFrame.current=false;setRotation({x:-.2,y:.3});setZoom(1.45);},[resetVersion]);
 useEffect(()=>()=>cancelAnimationFrame(animation.current),[]);
 const previewTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const focusing=useRef(false);
 function dismissPreview(){if(previewTimer.current)clearTimeout(previewTimer.current);setRevealed(null);}
 function inspectLogo(id:string){
  if(focusing.current)return;
  cancelAnimationFrame(animation.current);draggingFrame.current=false;
  dismissPreview();previewTimer.current=setTimeout(()=>setRevealed(id),250);
 }
 useEffect(()=>()=>{if(previewTimer.current)clearTimeout(previewTimer.current);},[]);
 useEffect(()=>{dismissPreview();},[detailOpen]);
 useEffect(()=>{dismissPreview();focusing.current=false;},[resetVersion]);
 const genreNav=useRef<HTMLElement>(null);const [genreOverflow,setGenreOverflow]=useState(false);
 useEffect(()=>{const el=genreNav.current;if(!el)return;const check=()=>setGenreOverflow(el.scrollWidth>el.clientWidth+2);const observer=new ResizeObserver(check);observer.observe(el);check();return()=>observer.disconnect();},[galaxies]);
 const svg=useRef<SVGSVGElement>(null);const hitRadius=22;const [size,setSize]=useState({width:1200,height:650});
 const drag=useRef<{x:number;y:number;distance:number}|null>(null);const moved=useRef(false);const velocity=useRef({x:0,y:0,at:0});const [revealed,setRevealed]=useState<string|null>(null);
 useEffect(()=>{const el=svg.current;if(!el)return;const observer=new ResizeObserver(()=>{const rect=el.getBoundingClientRect();setSize({width:rect.width,height:rect.height});});observer.observe(el);return()=>observer.disconnect();},[]);
 // Use the same orientation-aware input for dragging and release momentum.
 function rotate(dx:number,dy:number){
  if(!draggingFrame.current){cancelAnimationFrame(animation.current);dragTarget.current={...rotationRef.current};}
  dragTarget.current=orbitStep(dragTarget.current,dx,dy);
  if(draggingFrame.current)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setRotation({...dragTarget.current});return;}
  draggingFrame.current=true;let previous=performance.now();
  function frame(now:number){const blend=1-Math.exp(-Math.min(40,now-previous)/65);previous=now;const r=rotationRef.current,t=dragTarget.current;const next={x:r.x+(t.x-r.x)*blend,y:r.y+(t.y-r.y)*blend};rotationRef.current=next;setRotation(next);if(Math.abs(t.x-next.x)+Math.abs(t.y-next.y)>.0002)animation.current=requestAnimationFrame(frame);else draggingFrame.current=false;}
  animation.current=requestAnimationFrame(frame);
 }
 function coast(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||performance.now()-velocity.current.at>100)return;
  const v={...velocity.current};if(Math.hypot(v.x,v.y)<.001)return;
  cancelAnimationFrame(animation.current);draggingFrame.current=false;let previous=performance.now();
  function frame(now:number){const dt=Math.min(32,now-previous);previous=now;const decay=Math.exp(-dt/520);v.x*=decay;v.y*=decay;const r=rotationRef.current;const next=orbitStep(r,v.x*dt,v.y*dt);rotationRef.current=next;setRotation(next);if(Math.hypot(v.x,v.y)>.00003)animation.current=requestAnimationFrame(frame);}
  animation.current=requestAnimationFrame(frame);
 }
 function project(p:number[]){const [x,y,z]=p;const a=x*Math.cos(rotation.y)+z*Math.sin(rotation.y),b=-x*Math.sin(rotation.y)+z*Math.cos(rotation.y);const c=y*Math.cos(rotation.x)-b*Math.sin(rotation.x),d=y*Math.sin(rotation.x)+b*Math.cos(rotation.x);const scale=zoom*580/(580-d)*Math.min(size.width/480,size.height/430);return {x:size.width/2+a*scale*Math.min(1.65,size.width/size.height),y:size.height/2+c*scale,z:d,scale};}
 const centers=galaxies.map((g,i)=>{const y=1-2*(i+.5)/galaxies.length,a=i*2.399963,r=Math.sqrt(1-y*y);return {g,p:[Math.cos(a)*r*116,y*116,Math.sin(a)*r*116]};});
 const stars=centers.flatMap(({g,p})=>g.titles.map((t,j)=>{const angle=j*2.399963,radius=g.titles.length===1?0:Math.sqrt((j+.4)/g.titles.length)*36;const point=[p[0]+Math.cos(angle)*radius,p[1]+Math.sin(angle)*radius,p[2]+Math.sin(j*4.1)*20];return {g,t,slot:j,point,...project(point)};})).sort((a,b)=>a.z-b.z);
 const dust=useMemo(()=>Array.from({length:180},(_,i)=>{const y=1-2*(i+.5)/180,a=i*2.399963,r=Math.sqrt(1-y*y),radius=60+(i*17%100);return {p:[Math.cos(a)*r*radius,y*radius,Math.sin(a)*r*radius],r:i%11===0?1:.5};}),[]);
 function focusPoint(point:number[]){focusing.current=true;dismissPreview();const [x,y,z]=point;const targetY=-Math.atan2(x,z),targetX=Math.atan2(y,Math.hypot(x,z));draggingFrame.current=false;const from={...rotationRef.current},fromZoom=zoom;const delta=(to:number,from:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));const start=performance.now();cancelAnimationFrame(animation.current);const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100;function frame(now:number){const t=duration?Math.min(1,(now-start)/duration):1,e=t*t*t*(t*(t*6-15)+10);setRotation({x:from.x+delta(targetX,from.x)*e,y:from.y+delta(targetY,from.y)*e});setZoom(fromZoom+(Math.max(1.25,fromZoom)-fromZoom)*e);if(t<1)animation.current=requestAnimationFrame(frame);else focusing.current=false;}animation.current=requestAnimationFrame(frame);}
 useEffect(()=>{const el=svg.current;if(!el)return;const wheel=(e:WheelEvent)=>{if(document.activeElement!==el&&!el.contains(document.activeElement))return;e.preventDefault();cancelAnimationFrame(animation.current);draggingFrame.current=false;setZoom(z=>Math.max(.65,Math.min(4,z*Math.exp(-e.deltaY*.001))));};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);
 function focusGenre(name:string){setRevealed(null);onGenre(name);const center=centers.find(c=>c.g.name===name);if(center)focusPoint(center.p);}
 function focusTitle(genre:string,id:string,point:number[]){setRevealed(null);onTitle(genre,id);focusPoint(point);}
 const labelPositions:{x:number;y:number}[]=[];
 const labels=[...centers].sort((a,b)=>(b.g.name===selected?1:0)-(a.g.name===selected?1:0)||project(b.p).z-project(a.p).z).filter(({g,p})=>{const q=project(p);const y=q.y+28*Math.min(1.5,q.scale);if(labelPositions.some(v=>Math.abs(v.x-q.x)<105&&Math.abs(v.y-y)<35))return false;labelPositions.push({x:q.x,y});return true;});
 const cardWidth=size.width<600?130:170,cardHeight=64;
 // Persistent, world-attached callouts: fade through the near plane instead of swapping slots.
 const occupied:{x:number;y:number;w:number;h:number}[]=[];
 const callouts=[...stars].sort((a,b)=>Number(b.t.id===selectedTitle)-Number(a.t.id===selectedTitle)||b.z-a.z).map(star=>{

  const depth=Math.max(0,Math.min(1,(star.z-20)/75));
  const opacity=depth*depth*(3-2*depth);
  const scale=.72+.38*Math.max(0,Math.min(1,(star.z+20)/160));
  const side=star.slot%2===0?-1:1;
  const x=star.x+(side===1?32:-cardWidth*scale-32),y=star.y+(star.slot%4<2?-cardHeight*scale-30:36);
  const w=cardWidth*scale,h=cardHeight*scale;
  const collides=occupied.some(c=>x<c.x+c.w+12&&x+w+12>c.x&&y<c.y+c.h+12&&y+h+12>c.y);
  const visible=occupied.length<(size.width<600?3:5)&&opacity>0&&x>8&&x+w<size.width-8&&y>(genreOverflow?118:70)&&y+h<size.height-12&&!collides;
  if(visible)occupied.push({x,y,w,h});
  return {star,x,y,scale,opacity:visible?opacity*(detailOpen&&selectedTitle&&star.t.id!==selectedTitle? .48:1):0,w,h};
 });
 // Keep the single hover preview in screen space, away from its star and other labels.
 const previewCallout=!detailOpen?callouts.find(c=>c.star.t.id===revealed&&c.opacity>.3):undefined;
 const previewWidth=size.width<600?92:112,previewHeight=previewWidth*1.5;
 const preview=previewCallout?(()=>{
  const c=previewCallout,gap=16;
  const candidates=[{x:c.x-previewWidth-gap,y:c.y+c.h/2-previewHeight/2},{x:c.x+c.w+gap,y:c.y+c.h/2-previewHeight/2}];
  if(c.x>c.star.x)candidates.reverse();
  const scored=candidates.map(p=>{
   const x=Math.max(12,Math.min(size.width-previewWidth-12,p.x)),y=Math.max(76,Math.min(size.height-previewHeight-12,p.y));
   const collisions=callouts.filter(o=>o!==c&&o.opacity>.3&&x<o.x+o.w&&x+previewWidth>o.x&&y<o.y+o.h&&y+previewHeight>o.y).length;
   const starsCovered=stars.filter(o=>o.x>x-10&&o.x<x+previewWidth+10&&o.y>y-10&&o.y<y+previewHeight+10).length;
   return {x,y,score:collisions*10+starsCovered*2+Math.abs(x-p.x)/10};
  }).sort((a,b)=>a.score-b.score);
  return {...scored[0],record:c.star.t.latest};
 })():null;
 return <div className="galaxy-sphere"><nav ref={genreNav} className="genre-orbit-nav" aria-label="Explore genres">{galaxies.map(g=><button key={g.name} aria-pressed={selected===g.name} onClick={()=>focusGenre(g.name)}><i style={{background:g.color}}/><span>{g.name}</span><small>{g.count}</small></button>)}</nav>{genreOverflow&&<select className="genre-jump" aria-label="Jump to genre" value="" onChange={e=>{if(e.target.value)focusGenre(e.target.value);}}><option value="" disabled>All genres ({galaxies.length})</option>{galaxies.map(g=><option key={g.name} value={g.name}>{g.name} · {g.count}</option>)}</select>}<div className="galaxy-zoom"><button className="text-button" disabled={zoom<=.65} aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.65,z/1.2))}>−</button><output aria-label="Zoom level">{zoom.toFixed(1)}×</output><button className="text-button" disabled={zoom>=4} aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(4,z*1.2))}>+</button></div>
 <svg ref={svg} viewBox={`0 0 ${size.width} ${size.height}`} className="sphere-canvas" tabIndex={0} role="group" aria-label="Rotatable genre galaxy. Drag to rotate. Hover over or select a star for title details."
 onPointerDown={e=>{if(e.button!==0)return;focusing.current=false;dismissPreview();cancelAnimationFrame(animation.current);draggingFrame.current=false;velocity.current={x:0,y:0,at:performance.now()};setRevealed(null);e.currentTarget.focus();drag.current={x:e.clientX,y:e.clientY,distance:0};moved.current=false;}}
 onPointerMove={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;drag.current.distance+=Math.abs(dx)+Math.abs(dy);if(drag.current.distance>4){moved.current=true;if(!e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);}const now=performance.now(),dt=Math.max(8,now-velocity.current.at);velocity.current={x:Math.max(-.012,Math.min(.012,dx*.008/dt)),y:Math.max(-.012,Math.min(.012,-dy*.008/dt)),at:now};drag.current.x=e.clientX;drag.current.y=e.clientY;rotate(dx*.008,-dy*.008);}}
 onPointerUp={e=>{drag.current=null;if(moved.current)coast();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onPointerCancel={()=>{drag.current=null;}} onPointerLeave={()=>{if(!moved.current)drag.current=null;}}
 >
 <defs>{galaxies.map((g,i)=><radialGradient key={g.name} id={`genre-nebula-${i}`}><stop offset="0" stopColor={g.color} stopOpacity=".8"/><stop offset=".25" stopColor={g.color} stopOpacity=".48"/><stop offset=".6" stopColor={g.color} stopOpacity=".13"/><stop offset="1" stopColor={g.color} stopOpacity="0"/></radialGradient>)}<radialGradient id="cluster-star"><stop offset="0" stopColor="#fff" stopOpacity=".85"/><stop offset=".2" stopColor="#abc9e8" stopOpacity=".2"/><stop offset="1" stopColor="#abc9e8" stopOpacity="0"/></radialGradient><radialGradient id="stellar-core"><stop offset="0" stopColor="#ffffff"/><stop offset=".28" stopColor="#fff7e9"/><stop offset=".65" stopColor="currentColor"/><stop offset="1" stopColor="currentColor" stopOpacity=".15"/></radialGradient><radialGradient id="stellar-halo"><stop offset="0" stopColor="currentColor" stopOpacity=".4"/><stop offset=".4" stopColor="currentColor" stopOpacity=".1"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient><filter id="sphere-glow"><feGaussianBlur stdDeviation="7"/></filter></defs>
 <g pointerEvents="none" aria-hidden="true">{dust.map((d,i)=>{const q=project(d.p);return <circle key={i} cx={q.x} cy={q.y} r={d.r*q.scale} fill="#b5c7df" opacity={.08+.2*frontness(q.z)}/>;})}</g>
 {centers.map(({g,p})=>{const center=project(p);return <g key={g.name} pointerEvents="none">{stars.filter(s=>s.g.name===g.name).map(s=><line key={s.t.id} x1={center.x} y1={center.y} x2={s.x} y2={s.y} stroke={g.color} strokeOpacity={g.name===selected?'.22':'0'}/>)}<g className="genre-nebula" style={{color:g.color,opacity:(g.name===selected? .42:.16)*frontness(center.z)}}>
 {[[-23,8,6,75,35,-25],[18,-12,-5,64,31,28],[2,5,10,40,25,-12]].map(([dx,dy,dz,rx,ry,angle],i)=>{const q=project([p[0]+dx,p[1]+dy,p[2]+dz]),scale=Math.min(1.8,q.scale);return <ellipse key={i} cx={q.x} cy={q.y} rx={rx*scale} ry={ry*scale} transform={`rotate(${angle} ${q.x} ${q.y})`} fill={`url(#genre-nebula-${galaxies.findIndex(genre=>genre.name===g.name)})`} opacity={i===2?.55:.8}/>;})}
 </g></g>;})}
 {stars.map(s=><g key={s.t.id} className="sphere-star" style={{color:s.g.color}} role="button" aria-pressed={s.t.id===selectedTitle} tabIndex={0} aria-label={`${s.t.title}, ${s.g.name}, ${s.t.groups.length} grouped watched entries`} onPointerEnter={e=>{if(e.pointerType!=='touch'&&e.buttons===0&&!drag.current)onPreview(s.g.name,s.t.id);}} onClick={()=>{if(!moved.current)focusTitle(s.g.name,s.t.id,s.point);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusTitle(s.g.name,s.t.id,s.point);}}} opacity={(.12+.88*frontness(s.z))*(detailOpen&&selectedTitle&&s.t.id!==selectedTitle? .55:1)}>
 <circle cx={s.x} cy={s.y} r={hitRadius} fill="transparent"/>
 <g pointerEvents="none"><circle cx={s.x} cy={s.y} r={(s.t.id===selectedTitle?20:13)*Math.min(1.4,s.scale)} fill="url(#stellar-halo)"/>
 <path d={`M${s.x-6*Math.min(1.3,s.scale)},${s.y}h${12*Math.min(1.3,s.scale)}M${s.x},${s.y-6*Math.min(1.3,s.scale)}v${12*Math.min(1.3,s.scale)}`} stroke={s.g.color} strokeWidth=".6" opacity={.2+.25*frontness(s.z)}/>
 <circle cx={s.x} cy={s.y} r={(1.8+Math.min(1.2,Math.sqrt(s.t.groups.length)*.2))*Math.min(1.3,s.scale)} fill="url(#stellar-core)"/>
 <circle cx={s.x} cy={s.y} r={1} fill="#fff9eb"/>
 </g><circle cx={s.x} cy={s.y} r={8} fill="none" stroke={s.t.id===selectedTitle?'#e5c89a':'transparent'} strokeWidth="1.2" pointerEvents="none"/>
 <title>{s.t.title} · {s.g.name} · {s.t.groups.length} entries</title></g>)}
 {labels.map(({g,p})=>{const q=project(p);return <g key={g.name} role="button" tabIndex={0} className="sphere-label" aria-label={`${g.name}, ${g.count} grouped watched entries`} onClick={()=>{if(!moved.current)focusGenre(g.name);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focusGenre(g.name);}}} opacity={g.name===selected?1:.42+.58*frontness(q.z)}><text x={q.x} y={q.y+28*Math.min(1.5,q.scale)} textAnchor="middle" fill={g.color}>{g.name}</text><text className="sphere-label-count" x={q.x} y={q.y+28*Math.min(1.5,q.scale)+14} textAnchor="middle">{g.count} entries</text></g>;})}
 <g className="star-leaders" pointerEvents="none" aria-hidden="true">{callouts.map(({star,x,y,w,h,opacity})=>{const edge=x>star.x?x:x+w,mid=y+h/2;return <path key={star.t.id} d={`M ${star.x} ${star.y} L ${edge+(x>star.x?-14:14)} ${mid} L ${edge} ${mid}`} fill="none" stroke={star.t.id===selectedTitle?'#dfc59b':'#738598'} strokeWidth={star.t.id===selectedTitle?1.2:.7} opacity={opacity*(star.t.id===selectedTitle?1:.45)} style={{transition:'opacity 240ms ease'}}/>;})}</g>
 </svg><div className="star-callouts">{callouts.map(({star,x,y,scale,opacity})=><div key={star.t.id} onPointerEnter={e=>{if(e.pointerType!=='touch'&&e.buttons===0)inspectLogo(star.t.id);}} onPointerLeave={dismissPreview} className={`star-callout logo-callout ${revealed===star.t.id?'is-revealed':''} ${star.t.id===selectedTitle?'is-selected':''}`} aria-hidden={opacity<.1} style={{left:0,top:0,width:cardWidth,transform:`translate3d(${x}px,${y}px,0) scale(${scale})`,transformOrigin:'top left',opacity,pointerEvents:opacity>.3?'auto':'none',zIndex:Math.round(star.z+200)}}>
 <button className="star-logo" tabIndex={opacity>.3?0:-1} aria-label={`Focus ${star.t.title}`} onFocus={()=>inspectLogo(star.t.id)} onBlur={dismissPreview} onClick={()=>focusTitle(star.g.name,star.t.id,star.point)}><ClearLogo record={star.t.latest}/></button>

 </div>)}</div>{preview&&<div key={preview.record.id} className="star-poster-preview" aria-hidden="true" style={{left:preview.x,top:preview.y,width:previewWidth}}><Artwork record={{...preview.record,art:preview.record.poster||preview.record.art}}/></div>}</div>;
}
