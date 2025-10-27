import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Load environment variables
dotenv.config();

// Verify Stripe key is loaded
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ Stripe secret key is missing! Check your .env file');
  process.exit(1);
}

console.log('✅ Stripe configuration loaded');
connectDB();

const app = express();

// Configure CORS
    const allowedOrigins = [
      'http://localhost:3000', // Example frontend origin
      'https://orange-pond-073f1ad00.3.azurestaticapps.net', // Example production domain
 // Another allowed domain
    ];

    // Configure CORS options with a dynamic origin function
    const corsOptions = {
      origin: (origin, callback) => {
        // Check if the incoming origin is in the allowedOrigins list
        // Or if the origin is undefined (e.g., for direct requests or Postman)
        if (allowedOrigins.includes(origin) || !origin) {
          callback(null, true); // Allow the request
        } else {
          callback(new Error('Not allowed by CORS')); // Deny the request
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
      allowedHeaders: 'Content-Type,Authorization', // Allowed request headers
      credentials: true, // Allow sending cookies and HTTP authentication credentials
      optionsSuccessStatus: 200 // Set the status code for successful OPTIONS requests
    };
app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

// Optional debug log to confirm origins hitting the server
app.use((req, res, next) => {
  console.log('Incoming origin:', req.headers.origin);
  next();
});
// Special handling for Stripe webhook route
// Accept both singular and plural paths so webhooks configured either way will work
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Regular routes use JSON parsing
app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
// Mount payment routes at both /api/payment and /api/payments to be resilient
app.use("/api/payment", paymentRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
