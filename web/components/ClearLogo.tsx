import {useState} from 'react';
import type {PlayRecord} from '../../shared/contracts';
export function ClearLogo({record}:{record:PlayRecord}){const [failed,setFailed]=useState<string|null>(null);return record.logo&&record.logo!==failed?<img src={record.logo} alt={record.title} onError={()=>setFailed(record.logo||null)}/>:<span>{record.title}</span>;}
