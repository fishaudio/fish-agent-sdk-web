// prepublishOnly guard: the package must already be built.
//
// Publishing used to rebuild each package, but `changeset publish` publishes
// packages concurrently and every build starts by emptying its dist/, so a
// sibling's types build could find a dependency's dist/ half-written. The
// release script builds everything once up front; this only checks that it
// happened.
import { existsSync } from "node:fs";
import { join } from "node:path";

const manifest = JSON.parse(
  await import("node:fs/promises").then((fs) => fs.readFile("package.json", "utf8")),
);
const entry = manifest.main ?? manifest.module ?? manifest.types;
if (!entry || !existsSync(join(process.cwd(), entry))) {
  console.error(
    `${manifest.name}: ${entry ?? "dist/"} is missing. Run \`pnpm build\` at the repo root ` +
      "(or `pnpm release`, which builds first) before publishing.",
  );
  process.exit(1);
}
