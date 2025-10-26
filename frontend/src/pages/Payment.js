import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentAPI, bookingsAPI } from '../services/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function CheckoutForm({ clientSecret, bookingId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
          payment_method_data: {
            billing_details: {
              // You can add additional billing details here if needed
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        setError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent.status === 'succeeded') {
        try {
          // Update booking status in your database
          await paymentAPI.confirmPayment(paymentIntent.id);
          // Redirect to success page with payment details
          navigate('/booking-success', { 
            state: { 
              paymentId: paymentIntent.id,
              bookingId: bookingId,
              amount: paymentIntent.amount,
              status: paymentIntent.status
            }
          });
        } catch (dbError) {
          console.error('Database update error:', dbError);
          setError('Payment successful but booking update failed. Our team will contact you.');
        }
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError('An error occurred during payment processing. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      {error && <div className="payment-error">{error}</div>}
      <button 
        type="submit" 
        disabled={!stripe || processing} 
        className="payment-button"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function Payment() {
  const { bookingId } = useParams();
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = useState(null);
  const [currency, setCurrency] = useState('usd');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    async function initializePayment() {
      try {
        const data = await paymentAPI.createPaymentIntent({ bookingId });
        // backend returns { clientSecret }
        if (data && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setAmount(data.amount);
          setCurrency(data.currency || 'usd');
        } else {
          // sometimes backend might return the object directly
          const cs = data.client_secret || data.clientSecret;
          setClientSecret(cs);
          setAmount(data.amount || data.client_secret?.amount || null);
          setCurrency(data.currency || 'usd');
        }
      } catch (err) {
        console.error('createPaymentIntent error', err);
        const status = err?.response?.status;
        const message = err?.response?.data?.error || err.message || 'Could not initialize payment. Please try again.';

        // If unauthorized, redirect to auth and preserve the intended return path
        if (status === 401 || status === 403) {
          navigate('/auth', { state: { from: window.location.pathname } });
          return;
        }

        setError(message);
      }
    }
    initializePayment();
  }, [bookingId]);

  if (error) return <div className="payment-error">{error}</div>;
  if (!clientSecret) return <div>Loading payment form...</div>;

  const displayAmount = amount ? `${(amount/100).toFixed(2)} ${currency.toUpperCase()}` : null;

  const handlePayOffline = async () => {
    try {
      const resp = await bookingsAPI.confirmOffline(bookingId, 'cash');
      if (resp && resp.success) {
        // Navigate to success page
        navigate('/booking-success', { state: { bookingId, paymentMode: 'cash' } });
      } else {
        setError('Could not complete offline payment. Please try again.');
      }
    } catch (err) {
      console.error('Offline payment error', err);
      setError(err?.response?.data?.error || 'Offline payment failed');
    }
  };

  return (
    <div className="payment-container">
      <h2>Complete Your Booking</h2>
      {displayAmount && <p><strong>Amount:</strong> {displayAmount}</p>}

      <Elements 
        stripe={stripePromise} 
        options={{ clientSecret,
           appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#5c4033',
              colorBackground: '#f7f3e9',
              colorText: '#5c4033',
              colorDanger: '#b08968',
              fontFamily: 'Poppins, Arial, sans-serif',
              borderRadius: '8px',
            },
            rules: {
              '.Block': {
                backgroundColor: '#f7f3e9',
                borderColor: '#b08968',
              },
              '.Input': {
                color: '#5c4033',
              },
              '.Label': {
                color: '#5c4033',
              },
              '.Tab': {
                color: '#5c4033',
                borderRadius: '8px',
              },
              '.Tab--selected': {
                backgroundColor: '#b08968',
                color: '#fff',
              },
              '.Button': {
                backgroundColor: '#5c4033',
                color: '#f7f3e9',
                borderRadius: '8px',
                fontWeight: '600',
              },
              '.Button:disabled': {
                backgroundColor: '#b08968',
                color: '#fff',
              },
            }
          }
        }}
       
      >
        <CheckoutForm 
          clientSecret={clientSecret}
          bookingId={bookingId}
        />
      </Elements>

      <div style={{ marginTop: 16 }}>
        <p style={{ marginBottom: 8 }}>Or choose to pay on arrival (cash)</p>
        <button className="confirm-button" onClick={handlePayOffline}>Pay Offline (Cash)</button>
      </div>
    </div>
  );
}