import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import { sendBookingConfirmationEmail } from '../utils/email.js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest API version
  typescript: false
});

// Verify Stripe initialization
const verifyStripe = async () => {
  try {
    await stripe.customers.list({ limit: 1 });
    console.log('✅ Stripe connection verified successfully');
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message);
    throw error;
  }
};

// Verify Stripe connection on startup
verifyStripe();

export const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('user', 'email name');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.service) {
      return res.status(404).json({ error: 'Service not found for this booking' });
    }

    // Check if user is authorized to view this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    // If there's a payment intent ID, get payment details from Stripe
    if (booking.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
      return res.json({
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method_types[0],
        created: paymentIntent.created,
        service: booking.service,
        customerEmail: booking.user.email
      });
    }

    // If no payment intent, return basic booking info
    return res.json({
      bookingId: booking._id,
      status: booking.status,
      paymentStatus: 'no_payment',
      service: booking.service,
      customerEmail: booking.user.email
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({ error: 'Error retrieving payment status' });
  }
};

export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log('Creating payment intent for booking:', bookingId);
    
    // Find booking and populate service and user details
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('user');

    console.log('Found booking:', booking);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.service) {
      return res.status(400).json({ error: 'Booking service details not found' });
    }

    if (!booking.service.price) {
      return res.status(400).json({ error: 'Service price not set' });
    }

    // Create a PaymentIntent with the order amount and currency
    const amount = Math.round(Number(booking.service.price) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        serviceId: booking.service._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    // Save the payment intent ID to the booking
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency || 'usd'
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Could not create payment intent' });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const booking = await Booking.findById(paymentIntent.metadata.bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      await booking.save();

      // Send confirmation email
      await sendBookingConfirmationEmail(booking);

      res.json({ success: true, booking });
    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Could not confirm payment' });
  }
};

const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    const booking = await Booking.findById(paymentIntent.metadata.bookingId)
      .populate('service')
      .populate('user');

    if (!booking) {
      console.error('Booking not found for payment:', paymentIntent.id);
      return;
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.stripePaymentId = paymentIntent.id;
    await booking.save();

    // Send confirmation email
    await sendBookingConfirmationEmail(booking);

    // Schedule reminder email
    await scheduleBookingReminder(booking);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

const handleFailedPayment = async (paymentIntent) => {
  try {
  const booking = await Booking.findById(paymentIntent.metadata.bookingId).populate('service').populate('user');
    
    if (!booking) {
      console.error('Booking not found for failed payment:', paymentIntent.id);
      return;
    }

    booking.status = 'payment_failed';
    booking.paymentStatus = 'failed';
    await booking.save();

    // Optionally notify the user about the failed payment
    // You could add a function like sendPaymentFailureEmail here

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Note: req.body is already raw because of express.raw middleware
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handleFailedPayment(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};