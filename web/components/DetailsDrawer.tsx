import {timeZone} from '../../shared/timezone';
import {useEffect,useRef} from 'react';
import type {PlayRecord} from '../../shared/contracts';
import {Artwork} from './Artwork';
import {ClearLogo} from './ClearLogo';
import {formatDate,duration} from '../../shared/filters';
export function DetailsDrawer({record,onClose}:{record:PlayRecord;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const focus=document.activeElement as HTMLElement;dialog.current?.showModal();return ()=>{dialog.current?.close();focus?.focus();};},[]);
 return <dialog ref={dialog} className="detail-dialog media-detail" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}} aria-labelledby="detail-title">
 <button className="close" aria-label="Close details" onClick={onClose}>×</button>
 <div className="media-detail-hero"><Artwork record={record}/><div className="media-detail-logo"><ClearLogo record={record}/></div></div>
 <div className="detail-body"><div className="media-detail-heading"><Artwork record={{...record,art:record.poster||record.art}} alternatives={[record.poster||null,record.art]}/><div><h2 id="detail-title">{record.title}</h2><p>{record.episode||'Film'}</p><div className="media-detail-meta"><span>{record.genre}</span>{record.runtimeMs>0&&<span>{Math.round(record.runtimeMs/60000)} min</span>}</div></div></div>
 <div className="media-detail-record"><span className="media-detail-status">{record.played?'Recorded watched':'In progress'}</span><span>{record.profile} · {formatDate(record.at)}</span></div>
 {!record.played&&<div className="detail-progress"><div><span>Saved position</span><strong>{duration(record.positionMs)} <span>/ {record.runtimeMs?duration(record.runtimeMs):'—'}</span></strong></div>{record.runtimeMs>0&&<progress aria-label="Saved playback position" max={record.runtimeMs} value={Math.min(record.positionMs,record.runtimeMs)}/>}</div>}
 <details className="detail-source"><summary>Viewing details</summary><dl><dt>Source</dt><dd>{record.source}</dd><dt>Profile</dt><dd>{record.profile}</dd><dt>Last recorded</dt><dd>{new Date(record.at).toLocaleString('en-US',{timeZone:timeZone()})} {timeZone()}</dd>{record.played&&<><dt>Saved position</dt><dd>{duration(record.positionMs)} / {record.runtimeMs?duration(record.runtimeMs):'—'}</dd></>}</dl></details></div></dialog>;
}
