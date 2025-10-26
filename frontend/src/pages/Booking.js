import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useParams, useNavigate } from "react-router-dom";
import { bookingsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import './Booking.css';

export default function BookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const formatted = date.toISOString().split("T")[0];
        const data = await bookingsAPI.checkAvailability(serviceId, formatted);
        setSlots(data.availableSlots || []);
        setSelectedSlot(null);
      } catch (err) {
        console.error('Availability fetch error', err);
        setSlots([]);
      }
    }
    loadAvailability();
  }, [date, serviceId]);

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setMessage('Please select a time slot before confirming.');
      return;
    }

    if (!user) {
      // Redirect to login/signup
      navigate('/auth');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const bookingData = {
        serviceId,
        userId: user._id,
        date: date.toISOString().split('T')[0],
        timeSlot: selectedSlot,
        email: user.email
      };

      const response = await bookingsAPI.create(bookingData);

      // Navigate to payment page with booking id
      const bookingId = response.booking?._id || response._id;
      if (!bookingId) {
        setMessage('Booking created but could not get booking id.');
        setLoading(false);
        return;
      }

      // Go to payment flow (Payment page will use bookingId from params)
      navigate(`/payment/${bookingId}`);
    } catch (err) {
      console.error('Booking create error', err);
      const m = err?.response?.data?.error || err.message || 'Could not create booking';
      setMessage(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking">
      <h2>Schedule Your Service</h2>
      <div className="booking-content">
        <div className="calendar-card">
          <Calendar onChange={setDate} value={date} />
          <h4 style={{ marginTop: '1rem' }}>Available Slots</h4>
          <div className="slots">
            {slots.length === 0 && <div className="availability-note">No slots available for the selected date.</div>}
            {slots.map((slot, i) => (
              <button
                key={i}
                className={`slot-button ${selectedSlot === slot ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot)}
                aria-pressed={selectedSlot === slot}
              >
                {slot}
              </button>
            ))}
          </div>

          <div className="confirm-row">
            <button
              className="confirm-button"
              onClick={handleConfirm}
              disabled={loading || !selectedSlot}
            >
              {loading ? 'Confirming...' : 'Confirm & Pay'}
            </button>
            <button className="cancel-button" onClick={() => setSelectedSlot(null)}>Clear</button>
          </div>

          {message && <div style={{ marginTop: '0.75rem', color: '#7a4f4a' }}>{message}</div>}
        </div>

        <div className="image-card">
          <img src="/images/salonBooking.jpg" alt="service" />
        </div>
      </div>
    </div>
  );
}
