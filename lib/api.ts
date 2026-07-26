import { NextResponse } from 'next/server';
import { getSession, hasAccess, type Access } from './session';
export async function requireAccess(level:Access='member'){
  const session=await getSession();
  if(!session) return {error:NextResponse.json({error:'Nicht angemeldet.'},{status:401})};
  if(!hasAccess(session,level)) return {error:NextResponse.json({error:'Keine Berechtigung.'},{status:403})};
  return {session};
}
