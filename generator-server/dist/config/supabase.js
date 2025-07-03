"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
// src/config/supabase.ts
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
const supabaseUrl = env_1.env.supabaseUrl;
const supabaseKey = env_1.env.supabaseKey;
console.log("ENV DEBUG:", {
    url: process.env.SUPABASE_URL ? "present" : "missing",
    key: process.env.SUPABASE_KEY ? "present" : "missing",
});
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
