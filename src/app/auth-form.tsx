"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import { login, register, validRegistration } from "@/lib/supabase";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (registering) { const errors = validRegistration(name, email, password); if (errors.length) { setError(errors.join(" ")); return; } }
    else if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setBusy(true);
    try {
      if (registering) {
        const result = await register(email.trim().toLowerCase(), password, name.trim());
        setMessage(result.access_token ? "Your account is ready. You can now log in." : "Account created. Check your email to confirm your address, then log in.");
        setName(""); setPassword("");
      } else { await login(email.trim().toLowerCase(), password); window.location.assign("/dashboard"); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete the request."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><Link href="/" className="brand"><span className="brand-icon"><CircleDollarSign size={21}/></span>SpendSense<span className="ai-tag">AI</span></Link><div className="auth-heading"><span className="eyebrow">YOUR PERSONAL MONEY SPACE</span><h1>{registering ? "Create your account" : "Welcome back"}</h1><p>{registering ? "Your account starts with an empty dashboard." : "Log in to see your personal dashboard."}</p></div><form className="auth-form" onSubmit={submit}>{registering&&<label>Full name<input autoComplete="name" value={name} onChange={event=>setName(event.target.value)} required/></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} required/></label><label>Password<input type="password" autoComplete={registering?"new-password":"current-password"} minLength={registering?8:undefined} value={password} onChange={event=>setPassword(event.target.value)} required/>{registering&&<small>Use at least 8 characters.</small>}</label>{error&&<div className="form-errors" role="alert">{error}</div>}{message&&<div className="auth-success" role="status">{message}</div>}<button className="button button-green" disabled={busy}>{busy?"Please wait…":registering?"Create account":"Log in"}</button></form><p className="auth-switch">{registering?"Already registered?":"New to SpendSense?"} <Link href={registering?"/login":"/register"}>{registering?"Log in":"Create an account"}</Link></p><Link className="auth-home" href="/"><ArrowLeft size={15}/> Back to home</Link><p className="auth-privacy">Your financial records are stored in your Supabase account and protected by database ownership policies.</p></div></main>;
}
