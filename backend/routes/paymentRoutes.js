import express from 'express';
import { createPaymentIntent, confirmPayment, handleWebhook, getPaymentStatus } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Regular payment routes (need authentication)
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);
router.post('/confirm', authenticateToken, confirmPayment);
router.get('/status/:bookingId', authenticateToken, getPaymentStatus);

// Webhook endpoint (needs raw body and no auth)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Important: needs raw body for signature verification
  handleWebhook
);

export default router;