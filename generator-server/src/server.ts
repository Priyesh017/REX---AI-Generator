import express, { Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import useRoute from "./routes/routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Backend running ✅");
});

app.use("/api", useRoute);

app.listen(env.port, "0.0.0.0", () =>
  console.log(`🚀 Server is live on port ${env.port} (accessible by Render)`)
);
