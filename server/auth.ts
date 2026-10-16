import {createHash,timingSafeEqual} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
export interface Login {username:string;password:string}
export function validLogin(value:unknown):value is Login {
 const v=value as Login;return !!v&&typeof v.username==='string'&&!!v.username&&!/[\r\n:]/.test(v.username)&&typeof v.password==='string'&&v.password.length>0&&!/[\r\n]/.test(v.password);
}
export function authorized(req:Pick<IncomingMessage,'headers'>,login?:Login):boolean {
 if(!login)return true;
 const header=req.headers.authorization;if(!header?.startsWith('Basic '))return false;
 const actual=Buffer.from(header.slice(6),'base64').toString('utf8');
 const hash=(v:string)=>createHash('sha256').update(v).digest();
 return timingSafeEqual(hash(actual),hash(`${login.username}:${login.password}`));
}
