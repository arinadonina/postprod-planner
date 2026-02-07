import crypto from "crypto";
import { db } from "../db.js";

function verifyTelegramInitData(initData, botToken) {
  const urlParams = new URLSearchParams(initData);

  const hash = urlParams.get("hash");
  urlParams.delete("hash");

  const dataCheckString = [...urlParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

export async function telegramAuth(req, res, next) {
  const initData = req.headers["x-telegram-init-data"];

  if (!initData) {
    return res.status(401).json({ error: "No initData" });
  }

  const isValid = verifyTelegramInitData(
    initData,
    process.env.BOT_TOKEN
  );

  if (!isValid) {
    return res.status(403).json({ error: "Invalid initData" });
  }

  const params = new URLSearchParams(initData);
  const user = JSON.parse(params.get("user"));

  // 🔹 сохранить пользователя в БД (если его ещё нет)
  await db.query(
    `
    INSERT INTO users (id, username, first_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
    `,
    [user.id, user.username, user.first_name]
  );

  req.user = user;
  next();
}
