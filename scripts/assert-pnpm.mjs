// Lifecycle guard: refuse to pack or publish through anything but pnpm.
//
// The workspace manifests declare internal dependencies with the
// `workspace:` protocol. pnpm rewrites those to real version ranges when it
// packs, npm and yarn ship them verbatim, and a published tarball that still
// says `workspace:^` cannot be installed by anyone.
const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error(
    [
      "This package must be packed and published with pnpm.",
      `Detected package manager: ${userAgent || "unknown"}.`,
      "Run `pnpm publish` (or `pnpm release` from the repo root) so that",
      "`workspace:` dependency ranges are rewritten to real versions.",
    ].join("\n"),
  );
  process.exit(1);
}
