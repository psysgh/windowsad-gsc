import { execSync } from "node:child_process";

console.log("[*] Resetando banco SQLite local...");
execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit" });
execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
console.log("[+] Banco recriado em prisma/dev.db");
