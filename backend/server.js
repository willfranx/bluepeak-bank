import express from "express";
import userRoutes from "./routes/userRoutes.js";
import accountRoutes from "./routes/acccountRoutes.js"

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Web Security App API!");
});

// Mount user routes at /users
app.use("/api/users", userRoutes);

// Mount account routes at /accounts
app.use("/api/accounts", accountRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
