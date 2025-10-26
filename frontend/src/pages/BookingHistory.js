import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './BookingHistory.css';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsAPI.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError('Could not load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date + ' ' + booking.timeSlot);
      if (filter === 'upcoming') return bookingDate > now;
      if (filter === 'past') return bookingDate <= now;
      return true;
    });
  };

  const getStatusColor = (booking) => {
    const bookingDate = new Date(booking.date + ' ' + booking.timeSlot);
    const now = new Date();
    if (bookingDate < now) return 'var(--brown)';
    if (booking.status === 'confirmed') return '#2ecc71';
    return '#e67e22';
  };

  if (loading) return <div className="section">Loading your bookings...</div>;
  if (error) return <div className="section error-message">{error}</div>;

  const filteredBookings = filterBookings();

  return (
    <motion.div 
      className="section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="booking-history-container">
        <h2>My Bookings</h2>
        
        <div className="booking-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="no-bookings">No bookings found</p>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map((booking) => (
              <motion.div 
                key={booking._id}
                className="booking-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(booking) }}
                />
                <div className="booking-info">
                  <h3>{booking.service.name}</h3>
                  <p className="booking-date">
                    {format(new Date(booking.date), 'MMMM d, yyyy')}
                  </p>
                  <p className="booking-time">{booking.timeSlot}</p>
                  <p className="booking-status" style={{ color: getStatusColor(booking) }}>
                    {new Date(booking.date + ' ' + booking.timeSlot) < new Date() 
                      ? 'Completed'
                      : booking.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}