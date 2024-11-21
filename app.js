const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routes");

const app = express();

// Allow requests from specific origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://app.pv-glarecheck.com",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Check if the origin is allowed or not
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(router);

module.exports = app;
