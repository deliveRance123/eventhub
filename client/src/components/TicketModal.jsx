export default function TicketModal({ isOpen, onClose, event, user, registrationId }) {
  if (!isOpen || !event) return null;

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  const ticketRef = `EH-${String(event.id).padStart(3, '0')}-${String(user?.id || '1').padStart(4, '0')}-${registrationId || 'PASS'}`;
  const qrPayload = `EVENTHUB_PASS:${ticketRef}|EVENT:${event.title}|ATTENDEE:${user?.name || 'Guest'}|DATE:${event.event_date}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ticket-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ticket-modal-content" onClick={e => e.stopPropagation()}>
        <button className="ticket-modal-close" onClick={onClose} aria-label="Close ticket">✕</button>

        <div className="ticket-card printable-ticket">
          {/* Ticket Header */}
          <div className="ticket-header">
            <div className="ticket-brand">
              <span className="brand-mark">✦</span>
              <div>
                <strong>EventHub Admission Pass</strong>
                <span>Official Digital Ticket</span>
              </div>
            </div>
            <span className="ticket-badge">CONFIRMED</span>
          </div>

          {/* Ticket Body */}
          <div className="ticket-body">
            <h2 className="ticket-event-title">{event.title}</h2>
            <div className="ticket-category-tag">{event.category || 'General'}</div>

            <div className="ticket-details-grid">
              <div>
                <small>DATE & TIME</small>
                <strong>{formattedDate}</strong>
                <span>{formattedTime}</span>
              </div>
              <div>
                <small>VENUE</small>
                <strong>{event.venue}</strong>
              </div>
              <div>
                <small>ATTENDEE</small>
                <strong>{user?.name || 'Valued Guest'}</strong>
                <span>{user?.email || ''}</span>
              </div>
              <div>
                <small>REFERENCE CODE</small>
                <strong className="ticket-code">{ticketRef}</strong>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="ticket-qr-section">
              <div className="ticket-qr-frame">
                <img src={qrUrl} alt="Scannable Admission QR Code" className="ticket-qr-img" />
              </div>
              <p>Scan this QR code at the event entrance for fast verification.</p>
            </div>
          </div>

          {/* Ticket Actions */}
          <div className="ticket-actions no-print">
            <button type="button" className="btn btn-primary btn-full" onClick={handlePrint}>
              🖨️ Print / Save Ticket Pass
            </button>
            <button type="button" className="btn btn-outline btn-full" onClick={onClose} style={{ marginTop: 8 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
