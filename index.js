/**
 * ╔══════════════════════════════════════════════╗
 * ║      RANZ ISLAMIC KNOWLEDGE SYSTEM           ║
 * ║   Express API + Telegraf Bot + JSON DB       ║
 * ╚══════════════════════════════════════════════╝
 */

"use strict";

// ─────────────────────────────────────────────
// DEPENDENCIES
// ─────────────────────────────────────────────
const express    = require("express");
const cors       = require("cors");
const { Telegraf, Markup } = require("telegraf");
const { v4: uuidv4 } = require("uuid");
const fs         = require("fs");
const path       = require("path");

// ─────────────────────────────────────────────
// CONFIG (dari config.js → env vars)
// ─────────────────────────────────────────────
const CONFIG = require("./config");

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLERS — cegah crash di panel
// ─────────────────────────────────────────────
process.on("uncaughtException",  (err) => console.error("❌ uncaughtException:", err.message));
process.on("unhandledRejection", (err) => console.error("❌ unhandledRejection:", err?.message || err));

// ─────────────────────────────────────────────
// DATABASE — path & helper
// ─────────────────────────────────────────────
const DB = {
  ilmu : path.join(__dirname, "ilmu.json"),
  users: path.join(__dirname, "users.json"),
};

function readDB(file) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return []; }
}

function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// ─────────────────────────────────────────────
// INIT DB — buat file + isi default jika kosong
// ─────────────────────────────────────────────
function initDB() {
  if (!fs.existsSync(DB.ilmu)) {
    const today = new Date().toISOString().split("T")[0];
    writeDB(DB.ilmu, [
      {
        id: uuidv4(),
        judul: "Keutamaan Bismillah",
        isi: "Bismillahirrahmanirrahim adalah kalimat pembuka yang penuh berkah. Setiap amal yang dimulai dengan Bismillah akan mendapat ridha Allah SWT. Rasulullah SAW bersabda: 'Setiap perkara penting yang tidak dimulai dengan Bismillah maka ia terputus (dari keberkahan).' (HR. Ahmad)",
        kategori: "Dzikir", tanggal: today,
      },
      {
        id: uuidv4(),
        judul: "Syarat Sah Sholat",
        isi: "Syarat sah sholat ada 8: (1) Suci dari hadats besar dan kecil, (2) Suci badan, pakaian dan tempat dari najis, (3) Menutup aurat, (4) Menghadap kiblat, (5) Sudah masuk waktu sholat, (6) Mengetahui bahwa sholat itu fardhu, (7) Tidak meyakini salah satu rukun sholat sebagai sunnah, (8) Menjauhi hal yang membatalkan sholat.",
        kategori: "Fiqih", tanggal: today,
      },
      {
        id: uuidv4(),
        judul: "Rukun Iman",
        isi: "Rukun Iman ada 6: (1) Iman kepada Allah, (2) Iman kepada Malaikat-Nya, (3) Iman kepada Kitab-Kitab-Nya, (4) Iman kepada Para Rasul-Nya, (5) Iman kepada Hari Akhir, (6) Iman kepada Qadha dan Qadar. Ini adalah fondasi keyakinan seorang Muslim yang wajib diyakini dengan sepenuh hati.",
        kategori: "Aqidah", tanggal: today,
      },
      {
        id: uuidv4(),
        judul: "Tanda-tanda Kiamat Kecil",
        isi: "Di antara tanda kiamat kecil: (1) Diutusnya Nabi Muhammad SAW, (2) Wafatnya beliau, (3) Penaklukan Baitul Maqdis, (4) Wabah penyakit besar, (5) Banyaknya harta hingga tidak ada yang mau menerima zakat, (6) Fitnah banyak, (7) Banyak pembunuhan, (8) Munculnya kaum yang tidak beragama. Semua ini mengingatkan kita untuk selalu bersiap.",
        kategori: "Akhir Zaman", tanggal: today,
      },
      {
        id: uuidv4(),
        judul: "Doa Sebelum Tidur",
        isi: "بِاسْمِكَ اللّهُمَّ أَمُوتُ وَأَحْيَا\n\n'Bismika Allahumma amuutu wa ahyaa'\n\nArtinya: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.'\n\nHendaklah membaca doa ini sebelum tidur, karena tidur adalah saudara kembar kematian. Semoga Allah mewafatkan kita dalam keadaan husnul khatimah.",
        kategori: "Doa", tanggal: today,
      },
      {
        id: uuidv4(),
        judul: "Surah Al-Fatihah",
        isi: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ\n\nUmmu Al-Quran (induk Al-Quran). Wajib dibaca dalam setiap rakaat sholat.",
        kategori: "Al-Quran", tanggal: today,
      },
    ]);
    console.log("✅ ilmu.json dibuat dengan data default.");
  }
  if (!fs.existsSync(DB.users)) {
    writeDB(DB.users, []);
    console.log("✅ users.json dibuat.");
  }
}

initDB();

// ─────────────────────────────────────────────
// EXPRESS — setup
// ─────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// Root → kirim frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API health check
app.get("/api", (req, res) => {
  res.json({
    status: "API aktif",
    system: "RANZ Islamic Knowledge System",
    waktu: new Date().toISOString(),
    url: CONFIG.PUBLIC_URL,
    endpoints: [
      "GET    /api/ilmu",
      "POST   /api/ilmu",
      "DELETE /api/ilmu/:id",
      "GET    /api/users",
    ],
  });
});

// GET semua ilmu
app.get("/api/ilmu", (req, res) => {
  const data = readDB(DB.ilmu);
  res.json({ success: true, total: data.length, data });
});

// POST tambah ilmu
app.post("/api/ilmu", (req, res) => {
  const { judul, isi, kategori } = req.body;
  if (!judul || !isi || !kategori) {
    return res.status(400).json({ success: false, message: "judul, isi, dan kategori wajib diisi." });
  }
  const item = {
    id: uuidv4(),
    judul: judul.trim(),
    isi: isi.trim(),
    kategori: kategori.trim(),
    tanggal: new Date().toISOString().split("T")[0],
  };
  const data = readDB(DB.ilmu);
  data.unshift(item);
  writeDB(DB.ilmu, data);
  res.json({ success: true, message: "Ilmu berhasil ditambahkan.", data: item });
});

// DELETE hapus ilmu
app.delete("/api/ilmu/:id", (req, res) => {
  const data = readDB(DB.ilmu);
  const idx  = data.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Ilmu tidak ditemukan." });
  data.splice(idx, 1);
  writeDB(DB.ilmu, data);
  res.json({ success: true, message: "Ilmu berhasil dihapus." });
});

// GET semua users
app.get("/api/users", (req, res) => {
  const data = readDB(DB.users);
  res.json({ success: true, total: data.length, data });
});

// Fallback → frontend SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────
// START SERVER — bind 0.0.0.0 (PUBLIC ACCESS)
// ─────────────────────────────────────────────
app.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log("\n🔥 RANZ SYSTEM RUNNING");
  console.log(`📡 BIND  : ${CONFIG.HOST}  →  Semua interface aktif`);
  console.log("🌍 MODE  : PUBLIC ACCESS");
  console.log(`⏰ START : ${new Date().toISOString().replace("T", " ").slice(0, 19)}`);
  console.log(`🔌 PORT  : ${CONFIG.PORT}`);
  console.log(`🌐 WEB   : ${CONFIG.PUBLIC_URL}`);
  console.log(`📡 API   : ${CONFIG.PUBLIC_URL}/api`);
  console.log(`💡 TIP   : Set env DOMAIN=yourdomain.com untuk URL yang tepat\n`);
});

// ─────────────────────────────────────────────
// TELEGRAM BOT
// ─────────────────────────────────────────────
if (!CONFIG.BOT_TOKEN || CONFIG.BOT_TOKEN === "MASUKKAN_BOT_TOKEN_DISINI" || CONFIG.OWNER_ID === 0) {
  console.log("⚠️  Bot dilewati — BOT_TOKEN atau OWNER_ID belum diatur di env.\n");
} else {
  startBot();
}

function startBot() {
  const bot      = new Telegraf(CONFIG.BOT_TOKEN);
  const sessions = {};                                      // session per user

  // ── Helpers ──────────────────────────────
  const getSession = (id) => {
    if (!sessions[id]) sessions[id] = { state: null };
    return sessions[id];
  };

  const isOwner = (ctx) => ctx.from?.id === CONFIG.OWNER_ID;

  const saveUser = (from) => {
    const users = readDB(DB.users);
    const idx   = users.findIndex((u) => u.id === from.id);
    const entry = {
      id      : from.id,
      nama    : `${from.first_name || ""} ${from.last_name || ""}`.trim(),
      username: from.username || "-",
      bergabung: new Date().toISOString().split("T")[0],
    };
    if (idx === -1) users.push(entry);
    else users[idx] = entry;
    writeDB(DB.users, users);
  };

  // ── Menus ────────────────────────────────
  const ownerMenu = (ctx) =>
    ctx.reply(
      `👑 *HAI Developer, mari belajar ilmu dan tambah ilmu agar pahala jariyah mengalir* 🌙\n\n` +
      `Bismillahirrahmanirrahim...\n` +
      `Sistem RANZ Islamic Knowledge siap melayani.\n\n` +
      `🌐 ${CONFIG.PUBLIC_URL}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("📥 TAMBAH ILMU",         "tambah_ilmu")],
          [Markup.button.callback("❌ HAPUS ILMU",           "hapus_ilmu")],
          [Markup.button.callback("👥 MELIHAT SEMUA USER",   "lihat_user")],
          [Markup.button.callback("📚 MELIHAT SEMUA ILMU",   "lihat_ilmu")],
          [Markup.button.callback("🔔 UPDATE ILMU TERBARU",  "broadcast_update")],
        ]),
      }
    );

  const userMenu = (ctx) =>
    ctx.reply(
      `🌙 *Assalamu'alaikum warahmatullahi wabarakatuh*\n\n` +
      `Selamat datang di *RANZ Islamic Knowledge System* 📿\n\n` +
      `Sistem ini hadir sebagai sarana belajar ilmu Islam.\n` +
      `Semoga menjadi amal jariyah bagi kita semua. 🤲\n\n` +
      `🌐 Kunjungi: ${CONFIG.PUBLIC_URL}`,
      { parse_mode: "Markdown" }
    );

  // ── /start ───────────────────────────────
  bot.start((ctx) => {
    saveUser(ctx.from);
    isOwner(ctx) ? ownerMenu(ctx) : userMenu(ctx);
  });

  // ── TAMBAH ILMU ──────────────────────────
  bot.action("tambah_ilmu", (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Akses ditolak.");
    getSession(ctx.from.id).state = "awaiting_ilmu";
    ctx.answerCbQuery();
    ctx.reply(
      `📥 *TAMBAH ILMU BARU*\n\n` +
      `Kirim dalam format:\n\`judul|kategori|isi\`\n\n` +
      `Kategori tersedia:\n• Dzikir\n• Al-Quran\n• Fiqih\n• Aqidah\n• Akhir Zaman\n• Doa\n\n` +
      `Contoh:\n\`Doa Masuk Masjid|Doa|Allahummaftah li abwaba rahmatik...\`\n\n` +
      `Ketik /batal untuk membatalkan.`,
      { parse_mode: "Markdown" }
    );
  });

  // ── HAPUS ILMU ───────────────────────────
  bot.action("hapus_ilmu", (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Akses ditolak.");
    ctx.answerCbQuery();
    const data = readDB(DB.ilmu);
    if (!data.length) return ctx.reply("📭 Belum ada ilmu yang tersimpan.");
    const buttons = data.slice(0, 10).map((d) => [
      Markup.button.callback(`🗑 ${d.judul.substring(0, 30)}`, `del_${d.id}`),
    ]);
    buttons.push([Markup.button.callback("🔙 Kembali", "back_menu")]);
    ctx.reply("❌ *HAPUS ILMU*\n\nPilih ilmu yang ingin dihapus:", {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    });
  });

  // ── KONFIRMASI DELETE ────────────────────
  bot.action(/^del_(.+)$/, (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Akses ditolak.");
    const data = readDB(DB.ilmu);
    const idx  = data.findIndex((d) => d.id === ctx.match[1]);
    if (idx === -1) return ctx.answerCbQuery("❌ Ilmu tidak ditemukan.");
    const { judul } = data[idx];
    data.splice(idx, 1);
    writeDB(DB.ilmu, data);
    ctx.answerCbQuery("✅ Dihapus!");
    ctx.reply(`✅ Ilmu *"${judul}"* berhasil dihapus.`, { parse_mode: "Markdown" });
  });

  // ── LIHAT USER ───────────────────────────
  bot.action("lihat_user", (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Akses ditolak.");
    ctx.answerCbQuery();
    const users = readDB(DB.users);
    if (!users.length) return ctx.reply("📭 Belum ada user yang terdaftar.");
    let msg = `👥 *DAFTAR USER (${users.length})*\n\n`;
    users.forEach((u, i) => {
      msg += `${i + 1}. *${u.nama}*\n   @${u.username} | ID: \`${u.id}\`\n   Bergabung: ${u.bergabung}\n\n`;
    });
    ctx.reply(msg, { parse_mode: "Markdown" });
  });

  // ── LIHAT ILMU ───────────────────────────
  bot.action("lihat_ilmu", (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Akses ditolak.");
    ctx.answerCbQuery();
    const data = readDB(DB.ilmu);
    if (!data.length) return ctx.reply("📭 Belum ada ilmu yang tersimpan.");
    let msg = `📚 *SEMUA ILMU (${data.length})*\n\n`;
    data.slice(0, 15).forEach((d, i) => {
      msg += `${i + 1}. *${d.judul}*\n   📁 ${d.kategori} | 📅 ${d.tanggal}\n   ${d.isi.substring(0, 60)}...\n\n`;
    });
    if (data.length > 15) msg += `_...dan ${data.length - 15} ilmu lainnya di web._`;
    ctx.reply(msg, { parse_mode: "Markdown" });
  });

  // ── BROADCAST ────────────────────────────
  bot.action("broadcast_update", async (ctx) => {
    if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Akses ditolak.");
    ctx.answerCbQuery();
    const users  = readDB(DB.users);
    const latest = readDB(DB.ilmu)[0];
    if (!latest) return ctx.reply("📭 Belum ada ilmu untuk di-broadcast.");
    let sent = 0;
    for (const user of users) {
      if (user.id === CONFIG.OWNER_ID) continue;
      try {
        await bot.telegram.sendMessage(
          user.id,
          `📢 *Ilmu baru telah ditambahkan!*\n\n📖 *${latest.judul}*\n📁 Kategori: ${latest.kategori}\n\nCek sekarang di:\n🌐 ${CONFIG.PUBLIC_URL}`,
          { parse_mode: "Markdown" }
        );
        sent++;
      } catch { /* user mungkin block bot */ }
    }
    ctx.reply(`✅ *Broadcast selesai!*\n\nTerkirim ke ${sent} dari ${users.length - 1} user.`, { parse_mode: "Markdown" });
  });

  // ── KEMBALI ──────────────────────────────
  bot.action("back_menu", (ctx) => {
    ctx.answerCbQuery();
    if (isOwner(ctx)) ownerMenu(ctx);
  });

  // ── PESAN TEKS ───────────────────────────
  bot.on("text", (ctx) => {
    if (!isOwner(ctx)) { saveUser(ctx.from); return; }

    const sess = getSession(ctx.from.id);
    const text = ctx.message.text;

    if (text === "/batal") {
      sess.state = null;
      return ctx.reply("❌ Dibatalkan.");
    }

    if (sess.state === "awaiting_ilmu") {
      const parts = text.split("|");
      if (parts.length < 3) {
        return ctx.reply("⚠️ Format salah!\n\nGunakan:\n`judul|kategori|isi`", { parse_mode: "Markdown" });
      }
      const [judul, kategori, ...rest] = parts;
      const isi = rest.join("|");
      if (!judul.trim() || !kategori.trim() || !isi.trim()) {
        return ctx.reply("⚠️ Judul, kategori, dan isi tidak boleh kosong.");
      }
      const item = {
        id: uuidv4(),
        judul: judul.trim(),
        isi: isi.trim(),
        kategori: kategori.trim(),
        tanggal: new Date().toISOString().split("T")[0],
      };
      const data = readDB(DB.ilmu);
      data.unshift(item);
      writeDB(DB.ilmu, data);
      sess.state = null;
      ctx.reply(
        `✅ *Ilmu berhasil ditambahkan!*\n\n📖 *${item.judul}*\n📁 Kategori: ${item.kategori}\n📅 Tanggal: ${item.tanggal}\n\n_Ilmu ini sudah tampil di web._ 🌐`,
        { parse_mode: "Markdown" }
      );
      ownerMenu(ctx);
    }
  });

  // ── Launch ───────────────────────────────
  bot.catch((err) => console.error("❌ Bot error:", err.message));

  bot.launch()
    .then(() => console.log("🤖 Telegram Bot berjalan...\n"))
    .catch((err) => console.error("❌ Gagal start bot:", err.message));

  process.once("SIGINT",  () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
