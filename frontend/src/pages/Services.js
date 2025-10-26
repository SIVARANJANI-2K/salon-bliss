import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { servicesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await servicesAPI.getAll();
        setServices(data);
      } catch (err) {
        setError("Could not load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const handleBooking = (serviceId) => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate(`/booking/${serviceId}`);
    }
  };

  if (loading) return <div className="section">Loading services...</div>;
  if (error) return <div className="section">{error}</div>;

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  return (
    <div className="section">
      <h2>Our Services</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
        {services.map((service) => {
          // Backend model uses `image` and `description` fields
          console.log(service.image);
          const imagePath = service.image;

          return (
            <motion.div
              key={service._id}
              style={{
                background: "#fff",
                color: "#5c4033",
                width: "280px",
                padding: "1rem",
                borderRadius: "16px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={imagePath}
                alt={service.name}
                width="100%"
                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                style={{ borderRadius: "12px", height: "200px", objectFit: "cover" }}
              />
              <h3>{service.name}</h3>
              <p>{service.description || service.desc}</p>
              <button
                className="button"
                onClick={() => handleBooking(service._id)}
              >
                Book Now
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
