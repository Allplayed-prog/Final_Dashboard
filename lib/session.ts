import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export type Access = 'owner'|'management'|'moderator'|'recruiter'|'member';
export type Session = { id:string; username:string; avatar?:string|null; access:Access; roles?:string[]; exp:number };
const secret = () => process.env.DASHBOARD_SESSION_SECRET || 'development-only-change-me';
const sign = (payload:string) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
export function encodeSession(session:Session){ const p=Buffer.from(JSON.stringify(session)).toString('base64url'); return `${p}.${sign(p)}`; }
export function decodeSession(token?:string|null):Session|null{
  if(!token) return null;
  const [p,s]=token.split('.'); if(!p||!s||sign(p)!==s) return null;
  try { const value=JSON.parse(Buffer.from(p,'base64url').toString()) as Session; return value.exp>Date.now()?value:null; } catch { return null; }
}
export async function getSession(){ return decodeSession((await cookies()).get('nythera_session')?.value); }
const rank:Record<Access,number>={member:0,recruiter:1,moderator:2,management:3,owner:4};
export function hasAccess(session:Session|null, minimum:Access){ return !!session && rank[session.access] >= rank[minimum]; }
export function canManage(session:Session|null){ return hasAccess(session,'moderator'); }
