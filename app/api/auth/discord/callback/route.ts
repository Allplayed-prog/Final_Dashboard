import { NextResponse } from 'next/server';
import { encodeSession, type Access } from '@/lib/session';

export async function GET(req:Request){
  const current=new URL(req.url); const code=current.searchParams.get('code');
  if(!code) return NextResponse.redirect(new URL('/login?error=missing_code',current.origin));
  const base=process.env.NEXT_PUBLIC_APP_URL || current.origin;
  const redirectUri=`${base}/api/auth/discord/callback`;
  try{
    const tokenResponse=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID||'',client_secret:process.env.DISCORD_CLIENT_SECRET||'',grant_type:'authorization_code',code,redirect_uri:redirectUri})});
    if(!tokenResponse.ok) throw new Error('Discord OAuth-Token konnte nicht geladen werden.');
    const token=await tokenResponse.json();
    const userResponse=await fetch('https://discord.com/api/users/@me',{headers:{authorization:`Bearer ${token.access_token}`}});
    if(!userResponse.ok) throw new Error('Discord-Benutzer konnte nicht geladen werden.');
    const user=await userResponse.json();
    const guild=process.env.DISCORD_GUILD_ID||'';
    const memberResponse=await fetch(`https://discord.com/api/guilds/${guild}/members/${user.id}`,{headers:{authorization:`Bot ${process.env.DISCORD_BOT_TOKEN||''}`}});
    const member=memberResponse.ok?await memberResponse.json():null;
    const roles:string[]=member?.roles||[];
    let access:Access='member';
    if(process.env.OWNER_ROLE_ID && roles.includes(process.env.OWNER_ROLE_ID)) access='owner';
    else if(process.env.MANAGEMENT_ROLE_ID && roles.includes(process.env.MANAGEMENT_ROLE_ID)) access='management';
    else if(process.env.MODERATOR_ROLE_ID && roles.includes(process.env.MODERATOR_ROLE_ID)) access='moderator';
    else if(process.env.RECRUITER_ROLE_ID && roles.includes(process.env.RECRUITER_ROLE_ID)) access='recruiter';
    const value=encodeSession({id:user.id,username:user.global_name||user.username,avatar:user.avatar,access,roles,exp:Date.now()+7*86400000});
    const response=NextResponse.redirect(new URL('/',current.origin));
    response.cookies.set('nythera_session',value,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:7*86400});
    return response;
  }catch(error){
    const msg=encodeURIComponent(error instanceof Error?error.message:'Login fehlgeschlagen');
    return NextResponse.redirect(new URL(`/login?error=${msg}`,current.origin));
  }
}
