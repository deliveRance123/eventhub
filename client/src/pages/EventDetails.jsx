import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import TicketModal from '../components/TicketModal';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    api(`/events/${id}`).then(d => setEvent(d.event)).catch(e => setError(e.message));
    if (user) {
      api('/registrations/mine/list')
        .then(d => {
          const match = d.registrations.find(r => String(r.id) === String(id) && r.status === 'confirmed');
          if (match) {
            setRegistered(true);
            setRegistrationId(match.registration_id);
          }
        })
        .catch(() => {});
    }
  }, [id, user]);

  async function join() {
    if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const d = await api(`/registrations/${id}`, { method: 'POST' });
      setMessage(d.message);
      setRegistered(true);
      if (d.registration?.id) setRegistrationId(d.registration.id);
      const updated = await api(`/events/${id}`);
      setEvent(updated.event);
      setShowTicket(true); // Automatically show ticket modal upon successful booking!
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !event) {
    return (
      <main className="content-section">
        <p className="error-text">{error}</p>
        <Link to="/">Back to events</Link>
      </main>
    );
  }

  if (!event) return <main className="content-section"><p>Loading event...</p></main>;

  const date = new Date(event.event_date);
  const remaining = Math.max(0, event.capacity - event.registered_count);

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">← Back to events</Link>
      <img
        className="detail-image"
        src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
        alt=""
      />
      <div className="detail-layout">
        <article className="detail-main">
          <span className="category-pill static-pill">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="detail-description">{event.description}</p>
          <h2>About this event</h2>
          <p>{event.description}</p>
          <div className="detail-info">
            <div>
              <small>DATE & TIME</small>
              <strong>{date.toLocaleString()}</strong>
            </div>
            <div>
              <small>VENUE</small>
              <strong>{event.venue}</strong>
            </div>
            <div>
              <small>REGISTRATION DEADLINE</small>
              <strong>{event.registration_deadline ? new Date(event.registration_deadline).toLocaleString() : 'Not specified'}</strong>
            </div>
          </div>
        </article>

        <aside className="register-panel">
          <span className="eyebrow dark">SAVE YOUR SPOT</span>
          <h2>Register for this event</h2>
          <div className="spots">
            <strong>{remaining}</strong>
            <span>spots remaining<br />of {event.capacity}</span>
          </div>
          <div className="capacity-track">
            <span style={{ width: `${Math.min(100, (event.registered_count / event.capacity) * 100)}%` }} />
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="form-error">{error}</div>}

          {registered ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => setShowTicket(true)}
              >
                🎟️ View Admission Ticket & QR
              </button>
              <div className="success-message" style={{ textAlign: 'center', margin: 0 }}>
                You are registered for this event!
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-full"
              onClick={join}
              disabled={busy || remaining === 0}
            >
              {busy ? 'Processing...' : remaining === 0 ? 'Event full' : 'Register now'}
            </button>
          )}

          <p className="fine-print">Your registration details will be saved to your EventHub account.</p>
        </aside>
      </div>

      {/* QR Ticket Modal */}
      <TicketModal
        isOpen={showTicket}
        onClose={() => setShowTicket(false)}
        event={event}
        user={user}
        registrationId={registrationId}
      />
    </main>
  );
}
