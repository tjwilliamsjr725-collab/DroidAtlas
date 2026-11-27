# DroidAtlas 1.2.1

Data update to the working production 1.2 app, preserving its layout and original artwork. The approved green crystal image replaces the missing Kyber plaque; rebirth numbers remain live text. Blue and purple crystal artwork is retained as optional assets, not automatically assigned to rebirth requirements.

## Changes

- Six community-reported cycles through RB40, with required droids and minimum variants.
- Expanded roster and distinct Kyber collection states. Proto-Roller remains Legendary; Scourge Prime is Iconic with class unresolved.
- “Reported last need” shows the final rebirth use in the selected cycle and its required variant, not the variant needed immediately. For Cycle 1 RB2, BDX Explorer and 2BB recur at RB36 as Kyber; Bal-Core has no later reported use in that cycle.
- Exact historical Droidex tracking, search, filters, bulk controls and 17 Fusion recipes retained. Selling does not clear history, and higher variants never imply acquisition of lower variants or present ownership.
- Collection export in the information dialog, raw backup before the first edit, corrupt-save write protection and retained unknown historical entries.
- Existing installed app updates its cache; unrelated caches and localStorage are preserved.

## Evidence and unknowns

Official developer notes confirm the [Cycle 6 rework](https://communities.epicgames.com/thread/patch-notes-v1-35/R5TN), [Scourge rebirth exception](https://communities.epicgames.com/thread/patch-notes-v1-36-0/OAFy), and [Scourge Prime Iconic rarity](https://communities.epicgames.com/thread/v1-37-0-patch-notes/DsCl).

All 240 requirement rows agree between [Droidex](https://droidex.dubtrackr.win/droid-tycoon-tools/rebirth-cycles/) and [Tycoon Tools](https://www.tycoon-tools.com/droid-tycoon/rebirth-requirements/), after name/order normalization, in the November 5, 2026 review. Agreement is community corroboration, not direct in-game certification. The app labels it accordingly.

**RB36 exact credits remain pending:** sources report 1.19Qa versus 1.2Qa. Current roster completeness, exact upgrade/activation costs, Kyber activation requirements, Scourge collection eligibility and Scourge Prime class still need direct in-game evidence. Do not use the last-need number as a guarantee that selling is safe for fusion, income, other cycles or Scourgedex turn-ins.

## Collection safety

The collection key remains `droidatlas-droidex-v1`; no reset or automatic migration occurs. Keep the same hosting origin and path to retain browser access to existing storage. Export a backup through the information button before moving to another browser or origin. A newly opened local HTML file may use different storage without deleting the original collection.

## Validation

The isolated-browser suite checks all 240 rows and 720 plaques, independent last-need calculations, exact variant tracking, bulk controls, filters, navigation, corrupt saves, retained unknown keys, backup export and mobile widths 320/360/393/428. An actual installed 1.2 service worker upgraded to 1.2.1 at the same origin while retaining 301 seeded history entries; offline reload and unrelated-cache preservation passed. This does not claim testing on a real phone or use of the user's actual browser storage.

## Development

Install the development dependency with `npm install`; the tests expect Chrome to be installed. `npm run build` regenerates the standalone review builds, `release/index.html` and the published root `index.html`. `npm test` runs the data and browser checks.

Maintained game data: `production-update/game-data.json`. Original production baseline: `baseline/github-production-1.2.html`. Crystal masters: `artwork/kyber-plaques/`. Validation reports: `research/final-data-validation.json`, `tests/plaque-audit.json`, and `tests/release-validation.json`.

Theme extraction and further skin/PWA packaging work are separate side-project work, not prerequisites for keeping the tool current.

## Verified in-game: Path 4 / RB36 (2026-11-26)

A player-supplied in-game screenshot verifies the precise **1.19Qa** credit requirement and **NAV-EX, Bal-Core, VECT-ARM** (all **Kyber**). This replaces the formerly unresolved credit cost for Path 4 / RB36 only. The conflicting 1.2Qa community report remains recorded for provenance; other RB36 paths remain unverified. The screenshot also shows the rewards (50B credits, +320% multiplier, +250% EXP, 300 Nova Crystals), which are not yet tracked in the Rebirth data model. Build v1.2.3 updates the in-app badges to display the verified status on this single row. All other paths and requirements remain subject to their prior evidence labels.

## Verified in-game: Path 4 / RB37 (2026-11-27)

Player-supplied in-game photo confirms **2.50Qa** credits (existing app value **2.5Qa**), **SEN-TRI, Opti-Pod, Gunrunner**, all **Kyber**. These values already matched our community-reported Path 4 / RB37 row; DroidAtlas 1.2.4 upgrades only its credits and requirements evidence badges to **Verified in game**. The image also shows 100B credits, +340% multiplier, +250% EXP, +10% offline income, and 300 Nova Crystals as Rebirth rewards, plus an option for 407 Nova Crystals via Super Rebirth. Rewards are evidence notes only because the current app doesn't model them. Droid acquisition state must not be inferred from the screenshot's green checks.
