import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import EventDetails from './pages/EventDetails';
import MyEvents from './pages/MyEvents';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './context/AuthContext';

function Protected({children,admin=false}) {
  const {user,loading}=useAuth(); const location=useLocation();
  if(loading)return <div className="state-message">Loading your account...</div>;
  if(!user)return <Navigate to="/login" state={{from:location.pathname}} replace/>;
  if(admin&&user.role!=='admin')return <Navigate to="/" replace/>;
  return children;
}
function Layout(){return <><Navbar/><Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/login" element={<Auth mode="login"/>}/>
  <Route path="/register" element={<Auth mode="register"/>}/>
  <Route path="/events/:id" element={<EventDetails/>}/>
  <Route path="/my-events" element={<Protected><MyEvents/></Protected>}/>
  <Route path="/admin" element={<Protected admin><Admin/></Protected>}/>
  <Route path="*" element={<main className="content-section"><h1>Page not found</h1><a href="/">Return home</a></main>}/>
</Routes></>;}
export default function App(){return <BrowserRouter><AuthProvider><Layout/></AuthProvider></BrowserRouter>;}
