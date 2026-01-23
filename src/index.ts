import express from "express";
import cors from "cors";
import { AUTH_TOKEN, PORT } from "./utils.js";
import generatePfp from "./routes/generate_pfp.js";
import modifyPfp from "./routes/modify_pfp.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

if (!AUTH_TOKEN) {
  console.error("AUTH_TOKEN environment variable is required");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware

// Health check (no auth)
//app.get("/health", (_req: Request, res: Response) => {
//  res.json({ status: "ok" });
//});
//

app.use("/generate_pfp", generatePfp);
app.use("/modify_pfp", modifyPfp);

//
//
//app.get("/api/ping", (_req: Request, res: Response) => {
//  res.json({ message: "pong", timestamp: Date.now() });
//});
//
//app.post("/api/data", (req: Request, res: Response) => {
//  const { body } = req;
//  console.log("Received data:", body);
//  res.json({ received: body, timestamp: Date.now() });
//});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
