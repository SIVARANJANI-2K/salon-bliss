import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";


export default function About() {
 
  return (
    <motion.div
      className="section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h2>About Us</h2>
      <p>
        At Salon Bliss, we combine modern trends with timeless elegance. 
        Our stylists bring years of expertise to help you look and feel your best.
      </p>
    <div className="about-grid">
  <img src="/images/about-1.jpg" alt="Salon interior 1" className="large" />
  <img src="/images/about-2.jpg" alt="Salon interior 2" />
  <img src="/images/about-3.jpg" alt="Salon interior 3" />
</div>

   
    </motion.div>
  );
}
