import { useEffect, useState } from 'react';
import { api } from '../api';
import EventCard from '../components/EventCard';

const CATEGORIES = ['All', 'Technology', 'Business', 'Arts', 'General'];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      const categoryParam = selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      api(`/events?search=${encodeURIComponent(search)}${categoryParam}`)
        .then(d => setEvents(d.events))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">DISCOVER · CONNECT · EXPERIENCE</span>
          <h1>Find your next<br /><span>great experience.</span></h1>
          <p>Discover inspiring events, meet new people and reserve your place in just a few clicks.</p>
          <a className="btn btn-light" href="#events">Explore events <span>↓</span></a>
        </div>
        <div className="hero-decoration">
          <div className="hero-circle">✦</div>
          <div className="hero-note">Your next<br />experience<br /><strong>starts here.</strong></div>
        </div>
      </section>

      <section className="content-section" id="events">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">WHAT'S HAPPENING</span>
            <h2>Explore upcoming events</h2>
            <p>Find an event that matches your interests.</p>
          </div>
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, categories, venues..."
              aria-label="Search events"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="category-filter-bar" role="group" aria-label="Filter events by category">
          {CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="state-message">Loading events...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : events.length ? (
          <div className="event-grid">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No events found</h3>
            <p>Try selecting a different category or clearing your search term.</p>
            {selectedCategory !== 'All' && (
              <button
                className="btn btn-outline btn-small"
                style={{ marginTop: 12 }}
                onClick={() => { setSelectedCategory('All'); setSearch(''); }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>

      <section className="callout">
        <div>
          <span className="eyebrow">HAVE SOMETHING TO SHARE?</span>
          <h2>Bring people together.</h2>
          <p>Event organisers can manage their events and registrations from one place.</p>
        </div>
        <span className="callout-icon">✳</span>
      </section>

      <footer className="footer">
        <strong>EventHub</strong>
        <span>Online Event Management and Registration System</span>
        <span>© {new Date().getFullYear()} EventHub</span>
      </footer>
    </main>
  );
}
