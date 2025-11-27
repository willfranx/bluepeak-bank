import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan";
import bankAccountRoutes from "./routes/bankAccountRoutes.js"
import userAuthRoutes from "./routes/userAuthRoutes.js"
import transactionRoutes from "./routes/transactionRoutes.js"
import pool from "./db.js";
import { globalErrorHandler } from "./middleware/responseUtils.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { resendOTP, verifyOTP } from "./controllers/verifyController.js";

dotenv.config()

const app = express();
const port = process.env.PORT || 8001;


// Security headers 
app.use(helmet())

// Enable HTTPS too encrypt traffic between client and server
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );
}


// Trust proxy required for deployment 
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.REACT_CLIENT_URL || "http://localhost:5173",
  credentials: true,
}))

// Logging to investigate errors 
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}


if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    if (!isSecure) return res.redirect(`https://${req.headers.host}${req.url}`);
    next();
  });
}

// Accept max sizeof 5mb too prevent payload errors and abuse 
app.use(express.json({limit: "5mb"}));
app.use(cookieParser())

// Apply general rate limit globally
app.use(apiLimiter)


// 
app.get("/", (req, res) => {
  res.send("Welcome to the Web Security App API!");
});


// Mount account routes at /accounts
app.use("/api/accounts", bankAccountRoutes);

// Mount authentication routes at /auth
app.use("/api/auth", userAuthRoutes);

// Mount transaction routes at /transaction
app.use("/api/transactions", transactionRoutes)

// Mount verification route at /verify-email
app.post("/api/verify-email", verifyOTP);
app.post("/api/resend-token", resendOTP);

// Global error handler 
app.use(globalErrorHandler);


pool.on("connect", () => {
  console.log("Connected to Bluepeak database")
}) 

pool.on("error", (error) => {
  console.log("Error connecting to the database", error)
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 8001;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
