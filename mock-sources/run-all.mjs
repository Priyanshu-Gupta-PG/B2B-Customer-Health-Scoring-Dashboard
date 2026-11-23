import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const services = [
  { name: "stripe", script: join(root, "stripe/server.mjs"), port: 4101 },
  { name: "zendesk", script: join(root, "zendesk/server.mjs"), port: 4102 },
  { name: "product", script: join(root, "product/server.mjs"), port: 4103 },
];

const children = services.map(({ name, script, port }) => {
  const child = spawn(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    console.error(`[${name}] exited with code ${code}`);
    process.exit(code ?? 1);
  });
  return child;
});

function shutdown() {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`
Mock data websites
  Stripe invoices : http://localhost:4101
  Zendesk tickets : http://localhost:4102
  Product usage   : http://localhost:4103
`);
