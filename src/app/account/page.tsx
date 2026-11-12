"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleUserRound, LoaderCircle, LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";

type User = { id: string; email: string; display_name: string | null; role: string };

export default function AccountPage() {
  const [mode,setMode]=useState<"login"|"register">("login");
  const [user,setUser]=useState<User|null>(null);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  async function refresh() {
    setBusy(true);
    try {
      const response=await fetch("/api/auth/me",{credentials:"same-origin",cache:"no-store"});
      const data=await response.json();
      setUser(data.user??null);
      if(data.configured===false)setNotice("Customer accounts will activate after the production database is configured.");
    } catch { setError("Could not connect to the account service."); }
    finally { setBusy(false); }
  }
  useEffect(()=>{void refresh();},[]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch(mode==="login"?"/api/auth/login":"/api/auth/register",{
        method:"POST",headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify(mode==="login"?{email,password}:{name,email,password})
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error??"Account request failed.");
      setUser(data.user);setPassword("");setNotice(mode==="login"?"You are signed in.":"Your account has been created.");
    } catch(e) { setError(e instanceof Error?e.message:"Unable to complete the request."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"});
      if(!response.ok)throw new Error("Could not sign out.");
      setUser(null);setNotice("You have signed out.");
    } catch(e) {setError(e instanceof Error?e.message:"Unable to sign out.");}
    finally {setBusy(false);}
  }

  return <main className="account-page">
    <header className="account-topbar"><Link href="/" className="account-brand"><span className="account-brand-mark">CC</span><span>CHITRANYA <b>CAPITAL</b></span></Link><Link href="/" className="account-back"><ArrowLeft size={15}/> Back to website</Link></header>
    <section className="account-card">
      <div className="account-icon"><CircleUserRound size={25}/></div>
      {user ? <>
        <p className="account-eyebrow">CUSTOMER ACCOUNT</p><h1>Welcome, {user.display_name||"Investor"}</h1>
        <p className="account-subtitle">Your website account is signed in.</p>
        <div className="account-user"><span>Email</span><strong>{user.email}</strong><span>Account type</span><strong>{user.role==="admin"?"Administrator":"Customer"}</strong></div>
        <button className="account-submit" onClick={()=>void logout()} disabled={busy}>{busy?<LoaderCircle size={17} className="spin"/>:<LogOut size={17}/>} Sign out</button>
      </> : <>
        <p className="account-eyebrow">CHITRANYA CAPITAL ACCOUNT</p><h1>{mode==="login"?"Welcome back":"Create your account"}</h1>
        <p className="account-subtitle">One secure account for your investing workspace.</p>
        <div className="account-tabs"><button className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("");}}>Sign in</button><button className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("");}}>Create account</button></div>
        <form onSubmit={submit} className="account-form">
          {mode==="register"&&<label>Full name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={80} required placeholder="Your name"/></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required placeholder="you@example.com"/></label>
          <label>Password<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==="login"?1:12} maxLength={128} required placeholder={mode==="login"?"Your password":"At least 12 characters"}/></label>
          {mode==="register"&&<p className="account-hint"><ShieldCheck size={14}/> Use at least 12 characters. Your password is hashed on the server.</p>}
          <button className="account-submit" type="submit" disabled={busy}>{busy?<LoaderCircle size={17} className="spin"/>:mode==="login"?<LogIn size={17}/>:<UserPlus size={17}/>} {mode==="login"?"Sign in":"Create account"}</button>
        </form>
      </>}
      {error&&<p className="account-error" role="alert">{error}</p>}
      {notice&&<p className="account-notice" role="status">{notice}</p>}
      <p className="account-legal">Your account service is part of the CHITRANYA CAPITAL website. Account availability depends on production database configuration.</p>
    </section>
    <footer className="account-footer">SMARTER INVESTING. BETTER DECISIONS.</footer>
  </main>;
}
