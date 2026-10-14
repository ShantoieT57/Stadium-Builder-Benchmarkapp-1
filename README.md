# Stadium 8 Builder Benchmark

This repository holds a benchmark for app builders. You give a builder a business brief, it builds the whole app, and you score the result against the brief's rules.

The app is a transaction import and approval system for a bank operations team. An importer uploads daily transaction files, and an approver approves or rejects each transaction in them.

## What is in this repository

| File | What it is |
|---|---|
| `Transaction-Import-and-Approval-Brief.md` | The brief. It describes what the app must do in business terms, with an ID on every rule. |
| `TestFiles/transactions_2026-04-15.csv` | The example transaction file the brief refers to. It has 20 valid rows. |

The brief replaces the earlier benchmark, which paired a Linx 6 back end with separate front-end instructions. It deliberately gives no technical design, data model, or split between front end and back end. Deciding those is part of what the builder is tested on.

## How to run the benchmark

1. Give the builder the brief and the `TestFiles` folder. Do not add instructions beyond the brief, so every builder starts from the same input.
2. Let the builder produce the app.
3. Sign in with the two demo users listed in the brief, one as importer and one as approver.
4. Upload `TestFiles/transactions_2026-04-15.csv` as the importer and check the expected result in the brief's "The supplied example file" section.
5. Work through the brief's rules, section by section, as each role.

## How to score a build

Score each rule by its ID (for example `FP-05` or `RJ-01`) as one of:

| Score | Meaning |
|---|---|
| Met | The app does what the rule says. |
| Partly met | The app does some of it, or does it only in some places. |
| Not met | The app does not do it, or does something different. |

Pay particular attention to the rules that the app must enforce itself rather than only on screen: `TS-04` and `AC-03`. Check them by trying the action as the wrong role or on a transaction that is already final.

The "Not in scope" section of the brief lists what the builder does not need to build. Do not score those.
