// seeds/serviceSeeds.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service.js';

dotenv.config();

const services = [
  {
    name: "Classic Haircut",
    description: "Professional haircut with wash and style",
    price: 499,
    duration: 30,
    capacity: 2,
    image: "/images/haircut.jpg"
  },
  {
    name: "Spa Facial",
    description: "Relaxing facial with premium products",
    price: 999,
    duration: 60,
    capacity: 1,
    image: "/images/facial.jpg"
  },
  {
    name: "Hair Color",
    description: "Full hair coloring service",
    price: 1499,
    duration: 90,
    capacity: 1,
    image: "/images/hair-color.jpg"
  }
];

async function seedServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');

    // Insert new services
    await Service.insertMany(services);
    console.log('Added sample services');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedServices();