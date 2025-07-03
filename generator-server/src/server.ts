import express from "express";
import cors from "cors";
import { supabase } from "./config/supabase";
import { env } from "./config/env";
import useRoute from "./routes/routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

// app.get("/api/test-supabase", async (_, res) => {
//   const { data, error } = await supabase.from("images").select("*").limit(1);
//   if (error) {
//     res.status(500).json({ error: error.message });
//     return;
//   }
//   res.json(data);
// });

app.use("/api", useRoute);

app.listen(env.port, () =>
  console.log(`🚀 Server is running at http://localhost:${env.port}`)
);
