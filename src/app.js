import express from "express";
import morgan from "morgan";
import pkg from "../package.json";
const cors = require("cors")

import { createRoles } from "./libs/initialSetup";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin"

const app = express();
createRoles();
app.set("pkg", pkg);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  }),
)


app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: app.get("pkg").name,
    author: app.get("pkg").author,
    description: app.get("pkg").description,
    version: app.get("pkg").version,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes)

export default app;
