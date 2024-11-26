/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 27/11/2024 - 01:52:04
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 27/11/2024
    * - Author          : 
    * - Modification    : 
**/
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routes");

const app = express();

// Allow requests from specific origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://app.pv-glarecheck.com",
  "https://dev-solarglare.vercel.app",
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
