import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <div className="hero">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
        >
          <h1>{user ? `Welcome back, ${user.name}` : 'Welcome to Salon Bliss'}</h1>
          <p>Indulge in the luxury you deserve – book your beauty experience today.</p>
          <button
            className="button"
            onClick={() => navigate('/services')}
            aria-label="Explore Services"
          >
            Explore Services
          </button>
        </motion.div>
      </div>
    </>
  );
}
