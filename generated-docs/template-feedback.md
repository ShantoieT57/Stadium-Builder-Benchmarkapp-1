# Template feedback

## lint-staged pre-commit fails with "fatal: Needed a single revision" when CRLF warnings are printed

- **Where:** husky pre-commit → lint-staged (git 2.36.1.windows.1)
- **What happened:** with unstaged CRLF files elsewhere in the tree (here, uncommitted app-backend/ files awaiting the CLAUDE.backend.md manual-test gate), `git stash create` prints "warning: CRLF will be replaced by LF ..." lines. lint-staged captures that output as the stash hash and passes it to `git rev-parse --short`, which fails with "Needed a single revision". Every front-end commit is blocked until the unrelated files are committed.
- **Workaround used:** `git -c core.safecrlf=false commit ...` (silences the warning; hooks still run).
- **Suggested fix:** add a `.gitattributes` (e.g. `* text=auto eol=lf`) to the template, or set `core.safecrlf=false` in the repo setup script, so mixed-workflow repos (front-end + back-end gates) don't trip this.
