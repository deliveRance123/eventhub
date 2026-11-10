import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth({mode='login'}) {
  const isRegister = mode === 'register';
  const {login,register} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form,setForm] = useState({name:'',email:'',password:''});
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  function change(e) { setForm({...form,[e.target.name]:e.target.value}); }
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register(form.name,form.email,form.password);
      else await login(form.email,form.password);
      navigate(location.state?.from || '/',{replace:true});
    } catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="auth-card">
    <Link to="/" className="brand auth-brand"><span className="brand-mark">E</span> EventHub</Link>
    <span className="eyebrow dark">{isRegister?'JOIN THE COMMUNITY':'WELCOME BACK'}</span>
    <h1>{isRegister?'Create your account':'Log in to EventHub'}</h1>
    <p>{isRegister?'Register to discover events and reserve your place.':'Access your account and manage your event registrations.'}</p>
    <form onSubmit={submit} className="form-stack">
      {isRegister && <label>Full name<input name="name" value={form.name} onChange={change} required minLength="2" placeholder="Your full name"/></label>}
      <label>Email address<input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com"/></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength="8" placeholder="At least 8 characters"/></label>
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary btn-full" disabled={busy}>{busy?'Please wait...':isRegister?'Create account':'Log in'}</button>
    </form>
    <div className="auth-switch">{isRegister?'Already have an account?':'New to EventHub?'} <Link to={isRegister?'/login':'/register'}>{isRegister?'Log in':'Create an account'}</Link></div>
  </section></main>;
}
