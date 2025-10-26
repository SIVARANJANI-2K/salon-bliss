import React from "react";
import { motion } from "framer-motion";

export default function Contact() {
  return (
    <motion.div
      className="section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h2>Contact Us</h2>
      <p>📍 123 Bliss Street, Chennai, India</p>
      <p>📞 +91 98765 43210</p>
      <p>✉️ hello@salonbliss.com</p>
    </motion.div>
  );
}
