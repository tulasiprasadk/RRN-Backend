import "dotenv/config";
import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";

import routes from "../routes/index.js";
import "../config/database.js"; // ensure DB connection
import passport from "../passport.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // frontend (update for prod if needed)
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key", // TODO: use a strong secret in production!
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", routes);

// Only needed for serverless platforms like Vercel/AWS Lambda
// export const handler = serverless(app);

// Always start the server for Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});