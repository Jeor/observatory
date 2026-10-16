import {useEffect,useRef} from 'react';
import type {JournalGroup} from '../../shared/journal';
import type {PlayRecord} from '../../shared/contracts';
import {formatDate} from '../../shared/filters';
import {timeZone} from '../../shared/timezone';
import {Artwork} from './Artwork';

export function JournalDrawer({groups,onClose,onSelect}:{groups:JournalGroup[];onClose:()=>void;onSelect:(record:PlayRecord)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const record=groups[0].latest;
 useEffect(()=>{const trigger=document.activeElement as HTMLElement;const element=dialog.current;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';element?.showModal();return()=>{element?.close();document.body.style.overflow=overflow;trigger?.focus();};},[]);
 return <dialog ref={dialog} className="detail-dialog journal-drawer" aria-labelledby="journal-drawer-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
  <header className="journal-drawer-header"><div><span className="micro">{formatDate(record.at)} · {groups.length>1?`${groups.length} episodes`:`${groups[0].records.length} viewing records`}</span><h2 id="journal-drawer-title">{record.title}</h2></div><button className="text-button" onClick={onClose} aria-label="Close episode list" autoFocus>×</button></header>
  <div className="journal-drawer-list">{groups.map(group=><section key={group.latest.id} className="journal-drawer-entry"><button className="episode-row" onClick={()=>onSelect(group.latest)}><Artwork record={group.latest}/><span><strong>{group.latest.episode||'Film'}</strong><small>{[...new Set(group.records.map(r=>r.profile))].join(' & ')} · {formatDate(group.latest.at)}</small><small>{group.latest.played?'Recorded watched':'In progress'}</small></span><span aria-hidden="true">↗</span></button>{group.records.length>1&&<details className="drawer-records"><summary>{group.records.length} viewing records</summary>{group.records.map(r=><button key={r.id} onClick={()=>onSelect(r)}><span>{r.profile}</span><span>{new Date(r.at).toLocaleTimeString('en-US',{timeZone:timeZone(),hour:'numeric',minute:'2-digit'})} ↗</span></button>)}</details>}</section>)}</div>
 </dialog>;
}
