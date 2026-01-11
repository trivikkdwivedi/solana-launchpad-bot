import { Telegraf, Markup } from "telegraf";
import LocalSession from "telegraf-session-local";
import dotenv from "dotenv";

// ⚠️ MUST MATCH solana.ts EXPORT
import { inspectToken } from "./solana.ts";

dotenv.config();

/* =========================
   INIT
========================= */
if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

/* =========================
   SESSION
========================= */
const session = new LocalSession({
  database: "session_db.json",
});
bot.use(session.middleware());

/* =========================
   MENU
========================= */
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback("🔐 Authority Check", "AUTH_CHECK")],
  [Markup.button.callback("🚀 Create Token", "CREATE_TOKEN")],
  [Markup.button.callback("📦 Launchpad", "LAUNCHPAD")],
  [Markup.button.callback("📘 Learn", "LEARN")],
]);

/* =========================
   START
========================= */
bot.start(async (ctx) => {
  ctx.session = {};
  await ctx.reply(
    "🚀 *Solana Devnet Launchpad*\n\n" +
      "• Telegram-native\n" +
      "• Devnet only\n" +
      "• No trading\n" +
      "• No funds\n\n" +
      "_Choose an option below:_",
    {
      parse_mode: "Markdown",
      ...mainMenu,
    }
  );
});

/* =========================
   AUTHORITY CHECK
========================= */
bot.action("AUTH_CHECK", async (ctx) => {
  ctx.session.mode = "AUTH_CHECK";
  await ctx.answerCbQuery();
  await ctx.reply("🔐 Paste SPL token mint address:");
});

/* =========================
   TEXT HANDLER
========================= */
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (ctx.session?.mode === "AUTH_CHECK") {
    try {
      await ctx.reply("⏳ Inspecting token…");

      const result = await inspectToken(text);

      await ctx.reply(
        "🧠 *Token Inspection*\n\n" +
          `🖊 Mint Authority: *${result.mintAuthority ? "ACTIVE" : "REVOKED"}*\n` +
          `❄️ Freeze Authority: *${result.freezeAuthority ? "ACTIVE" : "REVOKED"}*\n\n` +
          `⚠️ Rug Risk: *${result.risk}*`,
        { parse_mode: "Markdown" }
      );
    } catch (err: any) {
      await ctx.reply(`❌ ${err.message}`);
    } finally {
      ctx.session.mode = null;
    }
  }
});

/* =========================
   LAUNCH
========================= */
bot.launch();
console.log("⚡ Bot running with FAST multi-step flow");

/* =========================
   CLEAN EXIT
========================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

