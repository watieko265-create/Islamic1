// config.js

const PORT = parseInt(process.env.PORT) || 25586;
const HOST = "0.0.0.0";

// isi domain lu di sini (biar ga tergantung env)
const DOMAIN = "gixsz.cloudpanellvip.biz.id";

const BOT_TOKEN = process.env.BOT_TOKEN || "8682558051:AAEMm54qdPB4N_iKXlTlWRieyF3gFpV7s4o";
const OWNER_ID = parseInt(process.env.OWNER_ID) || 1631024580;

// 🔥 FIX UTAMA DI SINI
const PUBLIC_URL = `http://${DOMAIN}:${PORT}`;

module.exports = {
  PORT,
  HOST,
  DOMAIN,
  BOT_TOKEN,
  OWNER_ID,
  PUBLIC_URL,
};