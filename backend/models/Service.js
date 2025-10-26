import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number,
  duration: Number, // e.g. 30 mins
  capacity: Number, // how many bookings per slot allowed
  image: String
});

export default mongoose.model("Service", serviceSchema);
