import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import TicketModal from '../components/TicketModal';

export default function MyEvents() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  async function load() {
    try {
      const d = await api('/registrations/mine/list');
      setItems(d.registrations);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    if (!window.confirm('Cancel this event registration?')) return;
    try {
      await api(`/registrations/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="content-section page-section">
      <span className="eyebrow dark">YOUR EVENT ACTIVITY</span>
      <h1>My registrations</h1>
      <p>Keep track of the events you have joined and access your digital ticket passes.</p>

      {error && <p className="error-text">{error}</p>}

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>No registrations yet</h3>
          <p>Explore events and reserve your place.</p>
          <Link className="btn btn-primary" to="/">Explore events</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Pass</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.registration_id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.venue}</small>
                  </td>
                  <td>{new Date(item.event_date).toLocaleString()}</td>
                  <td>
                    <span className={`status ${item.status}`}>{item.status}</span>
                  </td>
                  <td>
                    {item.status === 'confirmed' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => setSelectedTicket(item)}
                      >
                        🎟️ View QR Pass
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>
                    {item.status === 'confirmed' ? (
                      <button className="btn btn-outline btn-small" onClick={() => cancel(item.id)}>
                        Cancel
                      </button>
                    ) : (
                      <Link to={`/events/${item.id}`} className="text-link">View event</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          event={selectedTicket}
          user={user}
          registrationId={selectedTicket.registration_id}
        />
      )}
    </main>
  );
}
