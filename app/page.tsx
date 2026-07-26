
import {redirect} from 'next/navigation';
import {getSession,hasAccess} from '@/lib/session';
import {adminDb} from '@/lib/db';
import {safeQuery} from '@/lib/safe-db';
import {Shell} from '@/components/shell';

export const dynamic='force-dynamic';

export default async function Home(){
 const session=await getSession();
 if(!session)redirect('/login');
 if(!hasAccess(session,'moderator'))redirect('/me');
 const db=adminDb();

 const [members,templates,runs,panels,payouts,absences,tickets,activities]=await Promise.all([
  safeQuery(db.from('registrations').select('id',{count:'exact',head:true}).eq('status','approved'),{count:0} as any),
  safeQuery(db.from('event_templates').select('*').order('name'),[] as any[]),
  safeQuery(db.from('event_runs').select('id,status,scheduled_start,template_id,event_templates(name,participant_limit)').in('status',['registration_open','running']).order('created_at',{ascending:false}).limit(6),[] as any[]),
  safeQuery(db.from('panels').select('*').in('status',['active','repair_due','ready']).order('created_at',{ascending:false}).limit(6),[] as any[]),
  safeQuery(db.from('payouts').select('*').eq('status','open').order('created_at',{ascending:false}).limit(8),[] as any[]),
  safeQuery(db.from('absences').select('id',{count:'exact',head:true}).eq('status','active'),{count:0} as any),
  safeQuery(db.from('kill_tickets').select('id',{count:'exact',head:true}).eq('status','open'),{count:0} as any),
  safeQuery(db.from('event_logs').select('*').order('closed_at',{ascending:false}).limit(5),[] as any[])
 ]);

 const runIds=(runs.data||[]).map((x:any)=>x.id);
 const participantRows=runIds.length
  ? await safeQuery(db.from('event_participants').select('run_id').in('run_id',runIds),[] as any[])
  : {data:[] as any[]};
 const counts=(participantRows.data||[]).reduce((a:any,x:any)=>{a[String(x.run_id)]=(a[String(x.run_id)]||0)+1;return a},{});
 const payoutTotal=(payouts.data||[]).reduce((s:number,x:any)=>s+Number(x.amount||0),0);

 return <Shell title="Übersicht" subtitle="Alles Wichtige auf einen Blick">
  <section className="newHero">
   <div><small>NYTHERA MANAGEMENT</small><h2>Einfach. Klar. Professionell.</h2><p>Verwalte Events, Mitglieder, Panels, Auszahlungen und Sanktionen zentral – live mit Discord und Supabase verbunden.</p></div>
   <div className="heroShield">N</div>
  </section>

  <section className="newStats">
   <div className="newStat blueStat"><span>AKTIVE MITGLIEDER</span><b>{members.count||0}</b><small>Discord synchronisiert</small></div>
   <div className="newStat violetStat"><span>OFFENE EVENTS</span><b>{(runs.data||[]).length}</b><small>Anmeldung oder laufend</small></div>
   <div className="newStat orangeStat"><span>AKTIVE PANELS</span><b>{(panels.data||[]).length}</b><small>{(panels.data||[]).filter((x:any)=>x.status==='repair_due').length} brauchen Reparatur</small></div>
   <div className="newStat greenStat"><span>OFFENE AUSZAHLUNGEN</span><b>{(payouts.data||[]).length}</b><small>{payoutTotal.toLocaleString('de-DE')} $ insgesamt</small></div>
   <div className="newStat"><span>ABGEMELDET</span><b>{absences.count||0}</b><small>Aktive Abmeldungen</small></div>
   <div className="newStat"><span>KILL-TICKETS</span><b>{tickets.count||0}</b><small>Zu prüfen</small></div>
  </section>

  <div className="newDashboardGrid">
   <section className="newCard liveEvents">
    <div className="newCardHead"><div><h3>Live Events</h3><p>Teilnehmer und Status in Echtzeit</p></div><a href="/events">Alle Events →</a></div>
    <div className="newList">
     {(runs.data||[]).map((run:any,index:number)=>{
      const count=counts[String(run.id)]||0;
      const max=Number(run.event_templates?.participant_limit||25);
      const percent=Math.min(100,Math.round(count/max*100));
      const label=run.status==='running'?'LIVE':'OFFEN';
      return <div className="liveEventRow" key={run.id}>
       <div className={`eventLetter e${index%4}`}>{String(run.event_templates?.name||'EV').slice(0,2).toUpperCase()}</div>
       <div className="eventCore"><div className="lineOne"><b>{run.event_templates?.name||'Event'}</b><span className={`statusPill ${run.status==='running'?'live':'open'}`}>{label}</span></div><p>{run.scheduled_start?new Date(run.scheduled_start).toLocaleString('de-DE'):'Manuell'} · {count}/{max} Teilnehmer</p><div className="newProgress"><i style={{width:`${percent}%`}}/></div></div>
       <a className="viewBtn" href="/events">Öffnen</a>
      </div>
     })}
     {!(runs.data||[]).length&&<div className="newEmpty">Keine offenen oder laufenden Events.</div>}
    </div>
   </section>

   <aside className="newCard activityCard">
    <div className="newCardHead"><div><h3>Letzte Aktivitäten</h3><p>Was zuletzt passiert ist</p></div><a href="/event-logs">Alle Logs →</a></div>
    <div className="activityList">
     {(activities.data||[]).map((x:any)=><div className="activityItem" key={x.id}><span className="activityIcon">✓</span><div><b>{x.event_name}</b><p>{x.participant_count} Teilnehmer · {new Date(x.closed_at).toLocaleString('de-DE')}</p></div></div>)}
     {!(activities.data||[]).length&&<div className="newEmpty">Noch keine Event-Logs.</div>}
    </div>
   </aside>
  </div>

  <div className="newBottomGrid">
   <section className="newCard">
    <div className="newCardHead"><div><h3>Panels</h3><p>Reparaturen und Laufzeit</p></div><a href="/panels">Alle Panels →</a></div>
    <table className="newTable"><thead><tr><th>Panel</th><th>Besitzer</th><th>Status</th></tr></thead><tbody>
     {(panels.data||[]).slice(0,5).map((x:any)=><tr key={x.id}><td>#{x.panel_number}</td><td>{x.owner_name||x.owner_discord_id||'Unbekannt'}</td><td><span className={`smallPill ${x.status==='repair_due'?'warn':'ok'}`}>{x.status}</span></td></tr>)}
     {!(panels.data||[]).length&&<tr><td colSpan={3}>Keine aktiven Panels.</td></tr>}
    </tbody></table>
   </section>

   <section className="newCard">
    <div className="newCardHead"><div><h3>Live Auszahlungen</h3><p>Offene Beträge</p></div><a href="/payouts">Alle Auszahlungen →</a></div>
    <div className="payoutMiniList">
     {(payouts.data||[]).slice(0,5).map((x:any)=><div className="payoutMini" key={x.id}><div><b>Discord {String(x.discord_id).slice(-6)}</b><p>{x.category||'Auszahlung'}</p></div><strong>{Number(x.amount||0).toLocaleString('de-DE')} $</strong></div>)}
     {!(payouts.data||[]).length&&<div className="newEmpty">Keine offenen Auszahlungen.</div>}
    </div>
   </section>

   <section className="newCard">
    <div className="newCardHead"><div><h3>Event-Zeitplan</h3><p>Zeiten kompakt anzeigen</p></div><a href="/events">Bearbeiten →</a></div>
    <details className="scheduleDetails"><summary>Zeiten anzeigen</summary><div className="scheduleList">{(templates.data||[]).filter((x:any)=>x.active).slice(0,7).map((x:any)=><div key={x.id}><b>{x.name}</b><span>{x.automatic?(x.start_times||[]).join(', ')||'Automatisch':'Manuell'}</span></div>)}</div></details>
   </section>
  </div>
 </Shell>
}
