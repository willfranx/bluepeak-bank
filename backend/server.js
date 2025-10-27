import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import cors from "cors"
import userRoutes from "./routes/userRoutes.js";
import accountRoutes from "./routes/acccountRoutes.js"
import authRoutes from "./routes/authRoutes.js"

dotenv.config()

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.REACT_CLIENT_URL || "http://localhost:5173",
  credentials: true,
}))

app.use(express.json());
app.use(cookieParser())

app.get("/", (req, res) => {
  res.send("Welcome to the Web Security App API!");
});

// Mount user routes at /users
app.use("/api/users", userRoutes);

// Mount account routes at /accounts
app.use("/api/accounts", accountRoutes);

// Mount authentication routes at /auth
app.use("/api/auth", authRoutes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
``