'use client';
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="fatal"><div className="fatalCard"><div className="fatalIcon">!</div><h1>Diese Seite konnte nicht geladen werden</h1><p>{error.message||'Ein unerwarteter Fehler ist aufgetreten.'}</p><button className="btn" onClick={reset}>Erneut versuchen</button></div></div>}
