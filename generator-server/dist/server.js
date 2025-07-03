"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes/routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
app.use("/api", routes_1.default);
app.listen(env_1.env.port, () => console.log(`🚀 Server is running at http://localhost:${env_1.env.port}`));
