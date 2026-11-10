import { Link } from 'react-router-dom';

export default function EventCard({event}) {
  const date = new Date(event.event_date);
  const remaining = Math.max(0, Number(event.capacity) - Number(event.registered_count || 0));
  return <article className="event-card">
    <Link to={`/events/${event.id}`} className="event-image-wrap">
      <img src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'} alt="" className="event-image" />
      <span className="category-pill">{event.category}</span>
    </Link>
    <div className="event-card-body">
      <div className="event-date-small">{date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})} · {date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</div>
      <h3><Link to={`/events/${event.id}`}>{event.title}</Link></h3>
      <p>{event.description}</p>
      <div className="event-card-footer"><span>📍 {event.venue}</span><span>{remaining} spots left</span></div>
      <Link className="text-link" to={`/events/${event.id}`}>View event <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}
