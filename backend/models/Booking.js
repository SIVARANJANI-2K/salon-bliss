import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  date: String,   // YYYY-MM-DD
  timeSlot: String, // e.g. "10:30 AM"
  email: String,
  status: { type: String, default: "confirmed" },
  // Payment fields
  paymentIntentId: String,
  paymentStatus: { type: String, default: 'pending' },
  stripePaymentId: String,
  paymentMethod: { type: String, enum: ['stripe', 'cash'], default: 'stripe' }
});

export default mongoose.model("Booking", bookingSchema);
