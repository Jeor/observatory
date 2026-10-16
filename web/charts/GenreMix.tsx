import {useState} from 'react';
import {genreColor} from '../genreColor';

export function GenreMix({genres}:{genres:[string,number][]}){
 const [active,setActive]=useState<string|null>(null);
 const total=genres.reduce((sum,[,count])=>sum+count,0);
 const selected=genres.some(([name])=>name===active)?active:null;
 const percent=(count:number)=>new Intl.NumberFormat('en-US',{style:'percent',maximumFractionDigits:0}).format(count/total);
 const label=(name:string,count:number)=>`${name}: ${count} ${count===1?'entry':'entries'}, ${percent(count)}`;
 return <section className="review-taste genre-mix"><div className="section-heading"><h2>Period genre mix</h2><span className="genre-mix-total">{total} {total===1?'entry':'entries'}</span></div>
 {total?<><div className="genre-segments" role="group" aria-label="Genre proportions">
 {genres.map(([name,count])=><button key={name} className="genre-segment" style={{width:`${count/total*100}%`}} aria-label={label(name,count)} aria-pressed={selected===name} onPointerEnter={e=>{if(e.pointerType!=='touch')setActive(name);}} onFocus={()=>setActive(name)} onClick={()=>setActive(name)}><span style={{background:genreColor(name)}} className={selected&&selected!==name?'is-muted':''}/></button>)}
 </div><div className="genre-mix-legend" role="group" aria-label="Genre counts and percentages">
 {genres.map(([name,count])=><button key={name} aria-label={label(name,count)} aria-pressed={selected===name} onPointerEnter={e=>{if(e.pointerType!=='touch')setActive(name);}} onFocus={()=>setActive(name)} onClick={()=>setActive(selected===name?null:name)}><i style={{background:genreColor(name)}} aria-hidden="true"/><span>{name}</span><span className="genre-mix-value">{count}<span aria-hidden="true"> · </span>{percent(count)}</span></button>)}
 </div></>:<p className="empty small">No genre breakdown available.</p>}
 </section>;
}
