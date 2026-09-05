// Packs every public workspace package and checks the manifest that would
// land on npm: no `workspace:` (or other local-only) protocols may survive,
// and every internal dependency range must match the version being shipped.
//
// Run from the repo root: `node scripts/check-publish-manifests.mjs`.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const packagesDir = join(root, "packages");
const localOnly = /^(workspace|catalog|link|file|portal):/;

const workspace = new Map();
for (const dir of readdirSync(packagesDir)) {
  const manifest = JSON.parse(readFileSync(join(packagesDir, dir, "package.json"), "utf8"));
  if (!manifest.private) {
    workspace.set(manifest.name, { dir: join(packagesDir, dir), version: manifest.version });
  }
}

const problems = [];
const stage = mkdtempSync(join(tmpdir(), "fish-sdk-pack-"));
try {
  for (const [name, { dir, version }] of workspace) {
    execFileSync("pnpm", ["pack", "--pack-destination", stage], { cwd: dir, stdio: "pipe" });
    const tarball = readdirSync(stage).find((file) => file.endsWith(".tgz"));
    const packed = JSON.parse(
      execFileSync("tar", ["-xOf", join(stage, tarball), "package/package.json"], {
        encoding: "utf8",
      }),
    );
    rmSync(join(stage, tarball));

    for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
      for (const [dep, range] of Object.entries(packed[field] ?? {})) {
        if (localOnly.test(range)) {
          problems.push(`${name}: ${field}.${dep} is "${range}" in the packed manifest`);
          continue;
        }
        const internal = workspace.get(dep);
        if (internal && range !== `^${internal.version}`) {
          problems.push(
            `${name}: ${field}.${dep} is "${range}", expected "^${internal.version}" ` +
              `(the version being released)`,
          );
        }
      }
    }
    console.log(`ok  ${name}@${version}`);
  }
} finally {
  rmSync(stage, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error("\nPublish manifest check failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
