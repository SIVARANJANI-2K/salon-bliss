import mongoose from "mongoose";
import dotenv from "dotenv";
import Service from "./models/Service.js";

dotenv.config();

const services = [
  {
    name: "Haircut for Women",
    description: "Classic, layered, or trendy cuts tailored to you.",
    price: 600,
    duration: 45,
    capacity: 3,
    image: "/images/haircut-women.jpg",
  },
  {
    name: "Hair Spa",
    description: "Rejuvenate your scalp with nourishing treatments.",
    price: 800,
    duration: 60,
    capacity: 2,
    image: "/images/hairspa.jpg",
  },
  {
    name: "Manicure & Pedicure",
    description: "Pamper your hands and feet with care and elegance.",
    price: 500,
    duration: 60,
    capacity: 4,
    image: "/images/spa.jpg",
  },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await Service.deleteMany(); // optional: clears old data
    await Service.insertMany(services);
    console.log("Services inserted successfully!");
    process.exit();
  })
  .catch((err) => console.error("Error:", err));
