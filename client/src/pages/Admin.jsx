import { useEffect, useState } from 'react';
import { api } from '../api';

const empty = {title:'',description:'',category:'General',venue:'',event_date:'',registration_deadline:'',capacity:100,image_url:''};
export default function Admin() {
  const [events,setEvents]=useState([]); const [registrations,setRegistrations]=useState([]);
  const [form,setForm]=useState(empty); const [editing,setEditing]=useState(null);
  const [error,setError]=useState(''); const [message,setMessage]=useState('');
  async function load(){const [e,r]=await Promise.all([api('/events'),api('/registrations/admin/all')]);setEvents(e.events);setRegistrations(r.registrations);}
  useEffect(()=>{load().catch(e=>setError(e.message));},[]);
  function change(e){setForm({...form,[e.target.name]:e.target.value});}
  function startEdit(event){setEditing(event.id);setForm({...event,event_date:event.event_date.slice(0,16),registration_deadline:event.registration_deadline?event.registration_deadline.slice(0,16):''});window.scrollTo({top:0,behavior:'smooth'});}
  function reset(){setEditing(null);setForm(empty);}
  async function save(e){e.preventDefault();setError('');setMessage('');try{const payload={...form,capacity:Number(form.capacity)};await api(editing?`/events/${editing}`:'/events',{method:editing?'PUT':'POST',body:JSON.stringify(payload)});setMessage(editing?'Event updated successfully.':'Event created successfully.');reset();await load();}catch(err){setError(err.message);}}
  async function remove(id){if(!window.confirm('Delete this event and its registrations?'))return;try{await api(`/events/${id}`,{method:'DELETE'});setMessage('Event deleted.');await load();}catch(e){setError(e.message);}}
  function exportCsv(){const rows=[['Attendee','Email','Event','Event date','Status','Registered at'],...registrations.map(r=>[r.attendee_name,r.email,r.event_title,r.event_date,r.status,r.registered_at])];const csv=rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='event-registrations.csv';a.click();URL.revokeObjectURL(url);}
  const active=registrations.filter(r=>r.status==='confirmed').length;
  return <main className="content-section page-section admin-page">
    <span className="eyebrow dark">CONTROL CENTRE</span><h1>Admin dashboard</h1><p>Manage events and monitor attendee registrations.</p>
    <div className="stats-grid"><div className="stat-card"><small>TOTAL EVENTS</small><strong>{events.length}</strong></div><div className="stat-card"><small>TOTAL REGISTRATIONS</small><strong>{registrations.length}</strong></div><div className="stat-card"><small>CONFIRMED REGISTRATIONS</small><strong>{active}</strong></div></div>
    <section className="admin-form-section"><div className="admin-section-title"><h2>{editing?'Edit event':'Create a new event'}</h2>{editing&&<button className="btn btn-outline btn-small" onClick={reset}>Cancel edit</button>}</div>
      <form className="admin-form" onSubmit={save}>
        <label>Event title<input name="title" value={form.title} onChange={change} required/></label>
        <label>Category<input name="category" value={form.category} onChange={change} required/></label>
        <label className="wide">Description<textarea name="description" value={form.description} onChange={change} rows="4" required/></label>
        <label>Venue<input name="venue" value={form.venue} onChange={change} required/></label>
        <label>Capacity<input name="capacity" type="number" min="1" value={form.capacity} onChange={change} required/></label>
        <label>Event date and time<input name="event_date" type="datetime-local" value={form.event_date} onChange={change} required/></label>
        <label>Registration deadline<input name="registration_deadline" type="datetime-local" value={form.registration_deadline} onChange={change}/></label>
        <label className="wide">Image URL (optional)<input name="image_url" type="url" value={form.image_url} onChange={change} placeholder="https://..."/></label>
        {error&&<div className="form-error wide">{error}</div>}{message&&<div className="success-message wide">{message}</div>}
        <button className="btn btn-primary">{editing?'Save changes':'Publish event'}</button>
      </form>
    </section>
    <section className="admin-form-section"><div className="admin-section-title"><h2>Manage events</h2></div>
      <div className="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Registrations</th><th>Actions</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td><strong>{e.title}</strong><small>{e.category} · {e.venue}</small></td><td>{new Date(e.event_date).toLocaleDateString()}</td><td>{e.registered_count}/{e.capacity}</td><td className="actions"><button className="btn btn-outline btn-small" onClick={()=>startEdit(e)}>Edit</button><button className="btn btn-danger btn-small" onClick={()=>remove(e.id)}>Delete</button></td></tr>)}</tbody></table></div>
    </section>
    <section className="admin-form-section"><div className="admin-section-title"><h2>Attendee registrations</h2><button className="btn btn-outline btn-small" onClick={exportCsv}>Export CSV ↓</button></div>
      <div className="table-wrap"><table><thead><tr><th>Attendee</th><th>Email</th><th>Event</th><th>Status</th></tr></thead><tbody>{registrations.map(r=><tr key={r.registration_id}><td>{r.attendee_name}</td><td>{r.email}</td><td>{r.event_title}</td><td><span className={`status ${r.status}`}>{r.status}</span></td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
