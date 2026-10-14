# Template feedback

## lint-staged pre-commit fails with "fatal: Needed a single revision" when CRLF warnings are printed

- **Where:** husky pre-commit → lint-staged (git 2.36.1.windows.1)
- **What happened:** with unstaged CRLF files elsewhere in the tree (here, uncommitted app-backend/ files awaiting the CLAUDE.backend.md manual-test gate), `git stash create` prints "warning: CRLF will be replaced by LF ..." lines. lint-staged captures that output as the stash hash and passes it to `git rev-parse --short`, which fails with "Needed a single revision". Every front-end commit is blocked until the unrelated files are committed.
- **Workaround used:** `git -c core.safecrlf=false commit ...` (silences the warning; hooks still run).
- **Suggested fix:** add a `.gitattributes` (e.g. `* text=auto eol=lf`) to the template, or set `core.safecrlf=false` in the repo setup script, so mixed-workflow repos (front-end + back-end gates) don't trip this.

## `npx shadcn add tooltip` resolves the `utils` alias to an npm package named `cn`

- **Where:** Shadcn CLI (`shadcn` ^3.5.0) with `app-frontend/components.json` (`"aliases": { "utils": "@/lib/utils" }`)
- **What happened:** the generated `src/components/ui/tooltip.tsx` contained `import { cn } from "cn"` and `import { Tooltip as TooltipPrimitive } from "radix-ui"`, and the CLI added two dependencies to package.json: an unrelated npm package `cn` and the monolithic `radix-ui` package. That doesn't match the existing components, which import `@/lib/utils` and the per-primitive `@radix-ui/react-*` packages.
- **Workaround used:** `npm uninstall cn radix-ui`, `npm install @radix-ui/react-tooltip`, and rewrote the two imports to `@/lib/utils` and `import * as TooltipPrimitive from "@radix-ui/react-tooltip"`.
- **Suggested fix:** add a post-install check (or a note in CLAUDE.frontend.md Rule 1) that greps new `components/ui/*.tsx` for `from "cn"` / `from "radix-ui"`, or pin a CLI version and style that emits the `@/lib/utils` alias correctly.
