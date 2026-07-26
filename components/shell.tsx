
import Link from 'next/link';
import {getSession,hasAccess,type Access} from '@/lib/session';

type Item={icon:string;label:string;href:string;minimum:Access};
const nav:Item[]=[
 {icon:'⌂',label:'Übersicht',href:'/',minimum:'member'},
 {icon:'◷',label:'Events',href:'/events',minimum:'member'},
 {icon:'▣',label:'Panels',href:'/panels',minimum:'moderator'},
 {icon:'💰',label:'Auszahlungen',href:'/payouts',minimum:'moderator'},
 {icon:'👥',label:'Mitglieder',href:'/profiles',minimum:'recruiter'},
 {icon:'⚠',label:'Verwarnungen',href:'/warnings',minimum:'moderator'},
 {icon:'⚖',label:'Sanktionen',href:'/sanctions',minimum:'moderator'},
 {icon:'⊘',label:'Blacklist',href:'/blacklist',minimum:'moderator'},
 {icon:'◫',label:'Event-Logs',href:'/event-logs',minimum:'moderator'},
 {icon:'⌁',label:'System-Logs',href:'/logs',minimum:'moderator'},
 {icon:'⚙',label:'Einstellungen',href:'/setup',minimum:'management'}
];
const names:Record<Access,string>={owner:'Owner',management:'Management',moderator:'Moderator',recruiter:'Recruiter',member:'Member'};

export async function Shell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle?:string}){
 const session=await getSession();
 const allowed=nav.filter(x=>hasAccess(session,x.minimum));
 return <div className="newApp">
  <aside className="newSidebar">
   <div className="newBrand">
    <div className="newLogo">N</div>
    <div><b>Nythera Management</b><span>GRP02 SYSTEM</span></div>
   </div>
   <div className="guildCard"><div className="guildIcon">GR</div><div><b>NYTHERA | GRP02</b><span>Bot & Dashboard verbunden</span></div></div>
   <nav className="newNav">
    {allowed.map(item=><Link key={item.href+item.label} className="newNavItem" href={item.href}><span>{item.icon}</span>{item.label}</Link>)}
   </nav>
   <div className="systemCard"><div><b>Nythera Online</b><span>Alle Systeme einsatzbereit</span></div><i/></div>
   <div className="newUser">
    <div className="newAvatar">{session?.username?.slice(0,2).toUpperCase()||'G'}</div>
    <div><b>{session?.username||'Gast'}</b><span>{session?names[session.access]:'Gast'}</span></div>
    <a href="/api/auth/logout">⌄</a>
   </div>
  </aside>
  <main className="newMain">
   <header className="newTop">
    <div><h1>{title}</h1><p>{subtitle||'Alles Wichtige auf einen Blick'}</p></div>
    <div className="newTopActions">
     <button className="roundBtn">🔔</button>
     <button className="roundBtn">🌙</button>
     <span className="onlineBadge"><i/> NYTHERA ONLINE</span>
    </div>
   </header>
   {children}
  </main>
 </div>
}
