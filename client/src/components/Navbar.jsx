import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const {user,logout} = useAuth();
  const navigate = useNavigate();
  function signOut() { logout(); navigate('/'); }
  return <header className="navbar">
    <Link to="/" className="brand"><span className="brand-mark">E</span> EventHub</Link>
    <nav>
      <NavLink to="/">Explore events</NavLink>
      {user && <NavLink to="/my-events">My registrations</NavLink>}
      {user?.role === 'admin' && <NavLink to="/admin">Admin dashboard</NavLink>}
    </nav>
    <div className="nav-actions">
      {user ? <><span className="welcome">Hi, {user.name.split(' ')[0]}</span><button className="btn btn-outline btn-small" onClick={signOut}>Log out</button></>
      : <><Link className="nav-login" to="/login">Log in</Link><Link className="btn btn-primary btn-small" to="/register">Create account</Link></>}
    </div>
  </header>;
}
