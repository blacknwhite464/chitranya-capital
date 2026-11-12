"use client";

import { useState } from "react";
import Link from "next/link";
import { CloudDownload, CloudUpload, LoaderCircle } from "lucide-react";

const keys={watchlist:"cc-watchlist-v1",trades:"cc-trades-v1",corporateActions:"cc-corporate-actions-v1",screenerPresets:"cc-screener-presets-v1"} as const;
type State={watchlist:unknown[];trades:unknown[];corporateActions:unknown[];screenerPresets:unknown[]};
function readLocal():State {
  const read=(key:string):unknown[]=>{const raw=localStorage.getItem(key);if(!raw)return [];const value=JSON.parse(raw);if(!Array.isArray(value))throw new Error("One of your local data lists is invalid. Export a backup and repair it before syncing.");return value;};
  return {watchlist:read(keys.watchlist),trades:read(keys.trades),corporateActions:read(keys.corporateActions),screenerPresets:read(keys.screenerPresets)};
}
export default function AccountWorkspaceSync(){
  const [busy,setBusy]=useState<"save"|"restore"|null>(null);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);
  async function save(){
    setBusy("save");setMessage("");setError(false);
    try{
      const state=readLocal();
      const response=await fetch("/api/workspace",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error??"Could not save account data.");
      setMessage("Your watchlist, trades, corporate actions and screener presets were saved to your account.");
    }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Unable to save account data.");}
    finally{setBusy(null);}
  }
  async function restore(){
    if(!window.confirm("Restore the saved account workspace? This replaces the matching data currently stored in this browser. Download a local backup first if you need it."))return;
    setBusy("restore");setMessage("");setError(false);
    try{
      const response=await fetch("/api/workspace",{credentials:"same-origin",cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error??"Could not load account data.");
      if(!data.state)throw new Error("There is no saved account workspace yet.");
      const state=data.state as State;
      for(const [field,key] of Object.entries(keys))localStorage.setItem(key,JSON.stringify(state[field as keyof State]??[]));
      window.dispatchEvent(new Event("cc-corporate-actions-updated"));
      window.dispatchEvent(new Event("cc-screener-presets-updated"));
      setMessage("Account data restored. Refreshing this workspace…");
      window.location.reload();
    }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Unable to restore account data.");}
    finally{setBusy(null);}
  }
  return <section className="account-sync-panel"><div><strong>Account cloud backup</strong><p>Save this browser’s watchlist, trade ledger, dividend records and screener presets to your signed-in website account. Restore replaces those local lists.</p></div><div className="account-sync-actions"><button className="secondary-button" onClick={()=>void save()} disabled={!!busy}>{busy==="save"?<LoaderCircle className="spin" size={14}/>:<CloudUpload size={14}/>} Save to account</button><button className="secondary-button" onClick={()=>void restore()} disabled={!!busy}>{busy==="restore"?<LoaderCircle className="spin" size={14}/>:<CloudDownload size={14}/>} Restore from account</button><Link href="/account">Account settings ↗</Link></div>{message&&<p className={error?"form-error":"privacy-note"} role="status">{message}</p>}</section>;
}
