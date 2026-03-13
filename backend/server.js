require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");

const app = express();

app.use(express.json());

// connect database
connectDB();

app.get("/", (req, res) => {
  res.send("Library API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});