---
"@fishaudio/agent-protocol": patch
"@fishaudio/agent-client": patch
"@fishaudio/agent-react": patch
"@fishaudio/agent-widget": patch
"@fishaudio/agent-widget-embed": patch
---

Republish with resolved internal dependency ranges. The 0.2.0 tarballs declared their `@fishaudio/*` dependencies with the `workspace:^` protocol, which npm cannot install; packing and publishing now go through pnpm only, and a release-time check verifies the packed manifests.
