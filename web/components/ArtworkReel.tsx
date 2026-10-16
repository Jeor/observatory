import {useEffect,useRef} from 'react';
import type {PlayRecord} from '../../shared/contracts';
import {Artwork} from './Artwork';
import {ClearLogo} from './ClearLogo';
export function ArtworkReel({records,onSelect}:{records:PlayRecord[];onSelect:(r:PlayRecord)=>void}){
 const strip=useRef<HTMLDivElement>(null),frame=useRef(0),suppressClick=useRef(false);
 const drag=useRef<{id:number;start:number;x:number;at:number;velocity:number;moved:boolean}|null>(null);
 const tiles=Array.from({length:Math.max(1,Math.ceil(20/Math.max(1,records.length)))},()=>records).flat();
 const cycle=useRef(0);
 const wrap=(position:number)=>{const size=cycle.current;return size>0?size+((position-size)%size+size)%size:position;};
 useEffect(()=>{
  const el=strip.current;if(!el)return;
  const measure=()=>{const set=el.querySelector<HTMLElement>('.reel-cycle');if(!set)return;const old=cycle.current;cycle.current=set.getBoundingClientRect().width;el.scrollLeft=cycle.current+(old>0?((el.scrollLeft-old)%old+old)%old:0);};
  measure();const observer=new ResizeObserver(measure);const set=el.querySelector('.reel-cycle');if(set)observer.observe(set);
  return()=>observer.disconnect();
 },[records.map(r=>r.id).join('|')]);
 const stop=()=>{cancelAnimationFrame(frame.current);frame.current=0;};
 useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
 function release(cancelled=false){
  const el=strip.current,d=drag.current;if(!el||!d)return;
  drag.current=null;el.classList.remove('is-dragging');
  if(el.hasPointerCapture(d.id))el.releasePointerCapture(d.id);
  if(cancelled||!d.moved||performance.now()-d.at>100||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let speed=d.velocity,last=performance.now(),position=el.scrollLeft;
  function coast(now:number){
   const dt=Math.min(now-last,32);last=now;speed*=Math.exp(-dt/260);
   position=wrap(position-speed*dt);el!.scrollLeft=position;
   if(Math.abs(speed)>.015)frame.current=requestAnimationFrame(coast);
  }
  frame.current=requestAnimationFrame(coast);
 }
 return <div className="artwork-reel manual-reel">
 <div ref={strip} className="backdrop-reel-viewport" tabIndex={0} role="region" aria-label="Year in artwork. Drag to browse titles."
 onPointerDown={e=>{if(e.button!==0||e.pointerType==='touch')return;stop();suppressClick.current=false;drag.current={id:e.pointerId,start:e.clientX,x:e.clientX,at:performance.now(),velocity:0,moved:false};}}
 onPointerMove={e=>{const d=drag.current,el=strip.current;if(!d||!el||d.id!==e.pointerId)return;const now=performance.now();if(!d.moved&&Math.abs(e.clientX-d.start)<5)return;if(!d.moved){d.moved=true;suppressClick.current=true;el.setPointerCapture(e.pointerId);el.classList.add('is-dragging');}e.preventDefault();const dx=e.clientX-d.x,dt=Math.max(1,now-d.at);el.scrollLeft=wrap(el.scrollLeft-dx);d.velocity=Math.max(-2.5,Math.min(2.5,.65*dx/dt+.35*d.velocity));d.x=e.clientX;d.at=now;}}
 onPointerUp={()=>release()} onPointerCancel={()=>release(true)} onLostPointerCapture={()=>{if(drag.current)release(true);}}
 onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}
 onScroll={e=>{const el=e.currentTarget;if(cycle.current>0&&(el.scrollLeft<cycle.current||el.scrollLeft>=cycle.current*2))el.scrollLeft=wrap(el.scrollLeft);}} onFocusCapture={stop} onDragStart={e=>e.preventDefault()} onTouchStart={()=>{stop();suppressClick.current=false;}} onWheel={stop}
 onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();stop();const el=e.currentTarget;el.scrollLeft=wrap(e.key==='Home'?cycle.current:e.key==='End'?cycle.current*2-el.clientWidth:el.scrollLeft+(e.key==='ArrowRight'?300:-300));}}}>
 <div className="recap-art-strip backdrop-reel">
 {[0,1,2].map(copy=><div className="reel-cycle" key={copy}>{tiles.map((record,index)=><button tabIndex={copy===1&&index<records.length?0:-1} key={`${record.id}-${index}`} onClick={()=>{stop();onSelect(record);}} aria-label={`View ${record.title}`}><Artwork record={record} alternatives={[record.poster||null]}/><span className="recap-poster-logo"><ClearLogo record={record}/></span></button>)}</div>)}
 </div></div></div>;
}
