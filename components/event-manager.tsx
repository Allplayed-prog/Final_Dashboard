
'use client';

import {useEffect,useMemo,useState} from 'react';

type EventItem={
  id:number;
  name:string;
  active:boolean;
  automatic:boolean;
  start_times:string[];
  registration_minutes:number;
  participant_limit:number;
  discord_channel_id:string|null;
  travel_payout:number;
  win_payout:number;
  kill_payout:number;
  loss_kill_payout?:number;
  notes?:string|null;
};

type EventRun={
  id:number;
  template_id:number;
  status:string;
  scheduled_start:string|null;
  participants:number;
};

const blank:Partial<EventItem>={
  active:true,automatic:false,start_times:[],registration_minutes:25,
  participant_limit:25,travel_payout:0,win_payout:0,kill_payout:0,
  loss_kill_payout:0,notes:''
};

function scheduleLabel(e:EventItem){
  if(!e.automatic) return 'Manueller Start';
  if(e.name==='40er') return 'Stündlich um XX:25';
  return `Täglich um ${(e.start_times||[]).join(' und ')||'keine Zeit'} Uhr`;
}

export default function EventManager({canEdit=false}:{canEdit?:boolean}){
  const[items,setItems]=useState<EventItem[]>([]);
  const[runs,setRuns]=useState<EventRun[]>([]);
  const[edit,setEdit]=useState<Partial<EventItem>|null>(null);
  const[selected,setSelected]=useState<EventItem|null>(null);
  const[showAll,setShowAll]=useState(false);
  const[msg,setMsg]=useState('');

  const load=async()=>{
    const [eventsRes,runsRes]=await Promise.all([
      fetch('/api/events',{cache:'no-store'}),
      fetch('/api/events/live',{cache:'no-store'})
    ]);
    const eventsJson=await eventsRes.json();
    const runsJson=await runsRes.json();
    const data=Array.isArray(eventsJson)?eventsJson:[];
    setItems(data);
    setRuns(Array.isArray(runsJson)?runsJson:[]);
    if(!selected&&data.length)setSelected(data.find((x:EventItem)=>x.active)||data[0]);
    if(!eventsRes.ok)setMsg(eventsJson.error||'Events konnten nicht geladen werden.');
  };

  useEffect(()=>{load()},[]);

  const counts=useMemo(()=>({
    all:items.length,
    active:items.filter(x=>x.active).length,
    auto:items.filter(x=>x.automatic).length,
    manual:items.filter(x=>!x.automatic).length
  }),[items]);

  const openRuns=runs.filter(x=>x.status==='registration_open');
  const runningRuns=runs.filter(x=>x.status==='running');
  const participants=[...openRuns,...runningRuns].reduce((s,x)=>s+Number(x.participants||0),0);
  const visible=showAll?items:items.slice(0,7);

  async function save(){
    const r=await fetch(edit?.id?`/api/events/${edit.id}`:'/api/events',{
      method:edit?.id?'PATCH':'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(edit)
    });
    const j=await r.json();
    setMsg(r.ok?'Gespeichert.':j.error||'Fehler');
    if(r.ok){setEdit(null);load()}
  }

  return <>
    <section className="eventLiveBar">
      <div><span className="liveDot"/> <b>Anmeldung geöffnet</b><small>{openRuns.length?`${openRuns.length} Event(s)`:'Keine'}</small></div>
      <div><b>Aktive Teilnehmer</b><small>{participants} insgesamt</small></div>
      <div><b>Laufende Events</b><small>{runningRuns.length}</small></div>
      {canEdit&&<button className="btn" onClick={()=>setEdit({...blank})}>＋ Event erstellen</button>}
    </section>

    <section className="stats">
      <div className="stat"><div className="statLabel">Gesamt</div><div className="statValue">{counts.all}</div><div className="statHint">Verfügbare Events</div></div>
      <div className="stat"><div className="statLabel">Aktiv</div><div className="statValue">{counts.active}</div><div className="statHint">in dieser Guild</div></div>
      <div className="stat"><div className="statLabel">Automatisch</div><div className="statValue">{counts.auto}</div><div className="statHint">nach Zeitplan</div></div>
      <div className="stat"><div className="statLabel">Manuell</div><div className="statValue">{counts.manual}</div><div className="statHint">per Befehl</div></div>
    </section>

    <section className="eventMateColumns">
      <div className="card">
        <div className="cardHead">
          <div><h2>Event-Liste</h2><div className="muted">Alle Events und deren Status</div></div>
          {canEdit&&<button className="btn" onClick={()=>setEdit(items[0]||{...blank})}>⚙ Events bearbeiten</button>}
        </div>
        {msg&&<div className="notice">{msg}</div>}
        <div className="eventList">
          {visible.map(e=>{
            const run=runs.find(r=>r.template_id===e.id&&['registration_open','running'].includes(r.status));
            return <button className={'eventRow '+(e.active?'active ':'')+(selected?.id===e.id?'selected':'')} key={e.id} onClick={()=>setSelected(e)}>
              <div>
                <div className="eventName">{e.name}</div>
                <div className="eventMeta">◷ {scheduleLabel(e)}　◷ {e.registration_minutes} Min. Anmeldezeit</div>
              </div>
              <div className="pills">
                <span className={'pill '+(e.active?'green':'')}>{e.active?'Aktiv':'Inaktiv'}</span>
                <span className={'pill '+(e.automatic?'blue':'purple')}>{e.automatic?'Automatisch':'Manuell'}</span>
                {run&&<span className="pill orange">{run.status==='running'?'Läuft':'Offen'} · {run.participants}/{e.participant_limit}</span>}
                {canEdit&&<span className="btn ghost" onClick={(ev)=>{ev.stopPropagation();setEdit(e)}}>⚙ Bearbeiten</span>}
              </div>
            </button>
          })}
        </div>
        {items.length>7&&<button className="showMore" onClick={()=>setShowAll(v=>!v)}>{showAll?'Weniger anzeigen':`Mehr anzeigen (${items.length-7} weitere)`}⌄</button>}
      </div>

      <div className="card settingsSide">
        <div className="cardHead"><div><h2>Event Einstellungen</h2><div className="muted">Ausgewähltes Event</div></div></div>
        {selected&&<MiniSettings event={selected} canEdit={canEdit} onEdit={()=>setEdit(selected)}/>}
      </div>
    </section>

    {selected&&<section className="card discordPreviewCard">
      <div className="cardHead"><div><h2>Discord – Event Registrierung</h2><div className="muted">So wird die Anmeldung in Discord angezeigt</div></div></div>
      <DiscordPreview event={selected} run={runs.find(r=>r.template_id===selected.id)}/>
    </section>}

    {edit&&<div className="modal"><div className="dialog">
      <div className="cardHead"><div><h2>{edit.id?edit.name:'Neues Event'}</h2><div className="muted">Zeitplan, Discord-Kanal und Vergütung konfigurieren</div></div><span className="pill blue">EVENT</span></div>
      <div className="formGrid">
        <div className="field"><label>Name</label><input value={edit.name||''} onChange={x=>setEdit({...edit,name:x.target.value})}/></div>
        <div className="field"><label>Startzeiten (HH:MM, Komma)</label><input value={(edit.start_times||[]).join(', ')} onChange={x=>setEdit({...edit,start_times:x.target.value.split(',').map(v=>v.trim()).filter(Boolean)})}/></div>
        <div className="field"><label>Event Channel-ID</label><input value={edit.discord_channel_id||''} onChange={x=>setEdit({...edit,discord_channel_id:x.target.value})}/></div>
        <div className="field"><label>Max. Teilnehmer</label><input type="number" value={edit.participant_limit||0} onChange={x=>setEdit({...edit,participant_limit:Number(x.target.value)})}/></div>
        <div className="field"><label>Anmeldezeit (Minuten)</label><input type="number" value={edit.registration_minutes||0} onChange={x=>setEdit({...edit,registration_minutes:Number(x.target.value)})}/></div>
        <div className="field"><label>Reisekosten</label><input type="number" value={edit.travel_payout||0} onChange={x=>setEdit({...edit,travel_payout:Number(x.target.value)})}/></div>
        <div className="field"><label>Auszahlung pro Kill (Gewinn)</label><input type="number" value={edit.kill_payout||0} onChange={x=>setEdit({...edit,kill_payout:Number(x.target.value)})}/></div>
        <div className="field"><label>Auszahlung pro Kill (Niederlage)</label><input type="number" value={edit.loss_kill_payout||0} onChange={x=>setEdit({...edit,loss_kill_payout:Number(x.target.value)})}/></div>
        <div className="field"><label>Gewinn-Bonus</label><input type="number" value={edit.win_payout||0} onChange={x=>setEdit({...edit,win_payout:Number(x.target.value)})}/></div>
        <div className="field"><label>Zusätzliche Informationen</label><input value={edit.notes||''} onChange={x=>setEdit({...edit,notes:x.target.value})}/></div>
        <label className="toggle"><input type="checkbox" checked={!!edit.active} onChange={x=>setEdit({...edit,active:x.target.checked})}/> Event aktivieren</label>
        <label className="toggle"><input type="checkbox" checked={!!edit.automatic} onChange={x=>setEdit({...edit,automatic:x.target.checked})}/> Automatischer Zeitplan</label>
      </div>
      <div className="actions"><button className="btn ghost" onClick={()=>setEdit(null)}>Abbrechen</button><button className="btn" onClick={save}>💾 Speichern</button></div>
    </div></div>}
  </>
}

function MiniSettings({event,canEdit,onEdit}:{event:EventItem;canEdit:boolean;onEdit:()=>void}){
  return <div className={'miniSettings '+(event.active?'active':'')}>
    <div className="miniHead"><div><b>{event.name}</b><span>{event.active?'Konfiguriert':'Nicht konfiguriert'}</span></div><span className={'pill '+(event.active?'green':'')}>{event.active?'Aktiv':'Inaktiv'}</span></div>
    <div className="miniGrid">
      <div><span>Kill (Gewinn)</span><b>{Number(event.kill_payout||0).toLocaleString('de-DE')} $</b></div>
      <div><span>Kill (Niederlage)</span><b>{Number(event.loss_kill_payout||0).toLocaleString('de-DE')} $</b></div>
      <div><span>Reisekosten</span><b>{Number(event.travel_payout||0).toLocaleString('de-DE')} $</b></div>
      <div><span>Max. Teilnehmer</span><b>{event.participant_limit}</b></div>
      <div><span>Event Channel</span><b>{event.discord_channel_id||'Nicht gesetzt'}</b></div>
      <div><span>Anmeldezeit</span><b>{event.registration_minutes} Min.</b></div>
    </div>
    {event.notes&&<div className="notesBox">{event.notes}</div>}
    {canEdit&&<button className="btn fullBtn" onClick={onEdit}>⚙ Bearbeiten</button>}
  </div>
}

function DiscordPreview({event,run}:{event:EventItem;run?:EventRun}){
  const count=run?.participants||0;
  return <div className="discordMessage">
    <div className="discordHeader"><div className="avatar">N</div><b>Nythera Management</b><span>APP</span></div>
    <div className="discordEmbed">
      <div className="discordBody">
        <h3>{run?.status==='registration_open'?'Anmeldung geöffnet':'Anmeldung'} – {event.name}</h3>
        <div className="discordFields">
          <div><b>👥 Teilnehmer</b><span>{count}/{event.participant_limit}</span></div>
          <div><b>🚙 Anfahrtsvergütung</b><span>{Number(event.travel_payout||0).toLocaleString('de-DE')} $</span></div>
          <div><b>💵 Killvergütung</b><span>{Number(event.kill_payout||0).toLocaleString('de-DE')} $</span></div>
          <div><b>⏰ Anmeldung schließt</b><span>{event.registration_minutes} Minuten vor Start</span></div>
          <div><b>👥 Teilnehmerliste</b><span>{count?'Teilnehmer vorhanden':'Noch keine Teilnahme'}</span></div>
        </div>
      </div>
      <div className="eventImage">{event.name.slice(0,2).toUpperCase()}</div>
      <div className="discordButtons"><button className="discordJoin">✓ Anmelden</button><button className="discordLeave">⊘ Abmelden</button></div>
    </div>
  </div>
}
