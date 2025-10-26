// routes/serviceRoutes.js
import express from "express";
import Service from "../models/Service.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

export default router;
