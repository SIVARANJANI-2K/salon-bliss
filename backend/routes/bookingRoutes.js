// routes/bookingRoutes.js
import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();

router.get("/availability/:serviceId/:date", async (req, res) => {
  try {
    const { serviceId, date } = req.params;

    // validate serviceId to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ error: "Invalid serviceId" });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: "Service not found" });

    const existing = await Booking.find({ service: serviceId, date });

    // Define slots (could also be fetched from DB)
    const allSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"];
    const availableSlots = allSlots.filter(slot => {
      const count = existing.filter(b => b.timeSlot === slot).length;
      return count < service.capacity;
    });

    res.json({ availableSlots });
  } catch (err) {
    console.error("Error in availability route:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Create booking (requires auth)
router.post("/", authenticateToken, async (req, res) => {
  try {
  const { serviceId, date, timeSlot } = req.body;
  const userId = req.user._id;
  const email = req.user.email;

  const newBooking = new Booking({ service: serviceId, user: userId, date, timeSlot, email });
    await newBooking.save();
    res.json({ message: "Booking confirmed", booking: newBooking });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

// Get bookings for current user
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId }).populate({ path: 'service', strictPopulate: false });
    // Normalize returned bookings to match frontend expectations
    const formatted = bookings.map(b => ({
      _id: b._id,
      date: b.date,
      timeSlot: b.timeSlot,
      status: b.status,
      service: b.service,
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ error: 'Could not fetch bookings' });
  }
});
// Confirm booking via offline/cash payment and send confirmation email
router.post('/confirm-offline', authenticateToken, async (req, res) => {
  try {
    const { bookingId, paymentMode } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await Booking.findById(bookingId).populate('service').populate('user');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Ensure the booking belongs to the authenticated user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to confirm this booking' });
    }

    booking.paymentStatus = paymentMode || 'cash';
    booking.paymentMethod = paymentMode || 'cash';
    booking.status = 'confirmed';
    await booking.save();

    // Send confirmation email immediately
    try {
      await import('../utils/email.js').then(m => m.sendBookingConfirmationEmail(booking));
    } catch (emailErr) {
      console.error('Error sending confirmation email for offline payment:', emailErr);
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error confirming offline booking:', err);
    res.status(500).json({ error: 'Could not confirm offline booking' });
  }
});

export default router;