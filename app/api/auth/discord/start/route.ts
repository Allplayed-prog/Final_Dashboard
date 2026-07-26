import { NextResponse } from 'next/server';
export async function GET(){const base=process.env.NEXT_PUBLIC_APP_URL!;const q=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID!,response_type:'code',redirect_uri:`${base}/api/auth/discord/callback`,scope:'identify'});return NextResponse.redirect(`https://discord.com/oauth2/authorize?${q}`)}
