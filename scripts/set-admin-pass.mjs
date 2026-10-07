// 管理者パスを設定する: node scripts/set-admin-pass.mjs "新しいパス"
// パス本体は保存せず、SHA-256ハッシュだけを .env.local（Git管理外）に書き込む。
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const pass = process.argv[2];
if (!pass) {
  console.error('使い方: node scripts/set-admin-pass.mjs "新しいパス"');
  process.exit(1);
}
if (pass.length < 12) console.warn("⚠ 12文字以上を推奨（短いパスはハッシュから総当たりで割り出せます）");

const hash = createHash("sha256").update(pass, "utf8").digest("hex");
const file = new URL("../.env.local", import.meta.url);
let lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
lines = lines.filter((l) => l && !l.startsWith("VITE_ADMIN_HASH="));
lines.push(`VITE_ADMIN_HASH=${hash}`);
writeFileSync(file, lines.join("\n") + "\n");
console.log("✔ .env.local に管理者パスのハッシュを書き込みました。npm run build / release で反映されます。");
