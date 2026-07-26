
import {NextResponse} from 'next/server';
import {adminDb} from '@/lib/db';

export async function GET(){
  const db=adminDb();
  const {data:runs,error}=await db.from('event_runs').select('id,template_id,status,scheduled_start').in('status',['registration_open','running']).order('created_at',{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {data:participants}=await db.from('event_participants').select('run_id');
  const counts=(participants||[]).reduce((acc:any,row:any)=>{acc[String(row.run_id)]=(acc[String(row.run_id)]||0)+1;return acc;},{});
  return NextResponse.json((runs||[]).map((r:any)=>({...r,participants:counts[String(r.id)]||0})));
}
