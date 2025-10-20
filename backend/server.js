import express from "express";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Web Security App API!");
});

// Mount user routes at /users
app.use("/users", userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
