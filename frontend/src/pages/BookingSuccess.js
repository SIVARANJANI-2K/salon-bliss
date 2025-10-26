import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentId, bookingId, amount, status, paymentMode } = location.state || {};

  return (
    <div className="booking-success-container">
      <h2>Booking Successful!</h2>
      <p>Your booking has been confirmed.</p>
      {bookingId && <p><strong>Booking ID:</strong> {bookingId}</p>}
      {paymentId && <p><strong>Payment ID:</strong> {paymentId}</p>}
      {amount && <p><strong>Amount Paid:</strong> {(amount/100).toFixed(2)}</p>}
      {status && <p><strong>Payment Status:</strong> {status}</p>}
      {paymentMode && <p><strong>Payment Method:</strong> {paymentMode === 'cash' ? 'Cash (Offline)' : 'Stripe'}</p>}
      <button className='confirm-button' onClick={() => navigate('/services')}>Back to Services</button>
    </div>
  );
}
