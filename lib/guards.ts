import { redirect } from 'next/navigation';
import { getSession, hasAccess, type Access } from './session';
export async function guard(minimum:Access){
  const session=await getSession();
  if(!session) redirect('/login');
  if(!hasAccess(session,minimum)) redirect('/me');
  return session;
}
