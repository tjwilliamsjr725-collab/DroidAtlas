# DroidAtlas 1.2 — data update

**Current working baseline: production 1.2**, pinned to GitHub commit `85ab259893c6a043d2c8f34ab7ed485ee7fcc8a2`. The earlier v61 visual refresh is superseded for this product task. Skins/themes remain a separate side project.

Open `DroidAtlas_1.2_Data_Update.html`. It works as a local standalone file. The original production CSS, background and artwork are byte-identical. One narrowly scoped rule adds the previously missing Kyber variant plaque; no skin artwork or layout changes are included.

### Plaque repair

The new Kyber requirements exposed a missing variant-plaque style in production 1.2. This affected 307 of 720 plaque positions across 176 rebirth screens, including BB9 and R7 at Cycle 1 · RB15. Added only the missing Kyber plaque background. All seven original plaque designs remain unchanged. The full rendered audit now checks every plaque, not just whether the requirement cards exist.

## Changes

## Crystal image test

`DroidAtlas_1.2_Crystal_Test_v1.html` is a separate test product with the approved green crystal PNG embedded directly into the Kyber plaque background. The rebirth number remains live text. Blue and purple artwork is saved for later use; generic Kyber requirements do not specify a color.

To inspect: choose Cycle 1 / RB2 (two crystal plaques numbered 36), or Cycle 1 / RB15 (crystal plaques numbered 38 and 39). No external image files or server are needed. The original data-update file is unchanged.

Built with `node tools/build-crystal-test.cjs`. Passed `node tests/plaques.cjs --crystal` and `node tests/regression.cjs --production --crystal`: the embedded PNG decodes and matches the approved master bytes, all 720 plaques have backgrounds, all 240 rows render, collection checks pass, and mobile layouts at 320/360/393/428px have no horizontal overflow. RB15 was visually inspected.

### Data changes

- Expanded planner navigation from five cycles/RB35 to six cycles/RB40.
- Loaded all 240 currently researched community-reported requirements as the working table. The source/evidence badges are visible in the existing status area. These are not presented as newly verified in-game values.
- Updated the roster from 91 to 100 entries: eight later local additions plus officially announced Scourge Prime. Its Iconic rarity is confirmed, its class is Unknown. Proto-Roller remains Legendary.
- Added the later local build's four distinct Kyber acquisition states as data, using existing 1.2 button styling. These are reported states, with completeness awaiting direct verification. Scourge per-droid eligibility is still unresolved; no blanket collection entries are invented.
- Displayed the officially confirmed Scourge exception for rebirth requirements. It never fills other historical acquisition variants.
- Preserved last-requirement calculations through the expanded cycle, labeled **Reported last need**, with confirmation required before selling. This is not a verified sell-safe guarantee.
- Marked RB36 credit cost **Exact cost pending** because published values conflict (1.19Qa versus 1.2Qa). No rounding assumption is substituted.
- Kept 17 Fusion recipes, search, all filters, missing-only view, exact toggles, bulk controls, tab persistence and historical storage keys.
- Added a raw collection export in the existing information dialog and an automatic backup before the first edit. Invalid saved collection data cannot be overwritten. Unrecognized historical keys remain saved.
- Standalone file does not register a service worker. The live 1.2 deployment and its cache have not been changed.

## Evidence and outstanding verification

Official changes: [Cycle 6 reworked](https://communities.epicgames.com/thread/patch-notes-v1-35/R5TN), [Scourge satisfies all rebirth variants](https://communities.epicgames.com/thread/patch-notes-v1-36-0/OAFy), [Scourge Prime is Iconic](https://communities.epicgames.com/thread/v1-37-0-patch-notes/DsCl).

Reported tables: [Droidex](https://droidex.dubtrackr.win/droid-tycoon-tools/rebirth-cycles/), downloaded November 5, 2026. Its review-date/version metadata is inconsistent, so this remains a **data-review build**, not certification of the full latest game state. The complete source is retained under `research/` in the workspace. Roster additions/Kyber state labels come from the later local v61 dataset, not its styling.

Needed to close verification: current in-game Cycle 6 tables; Cycles 1–5 RB36–40; exact credits/upgrade/activation costs; Kyber activation requirements; current roster/rarity/class and Scourge eligibility. In-game evidence takes precedence over community tables. No current ownership is inferred from acquisition history, and selling never clears Droidex.

## Collection safety

No existing collection was reset or migrated. The key remains `droidatlas-droidex-v1`; entries remain `exact droid name||exact variant`. Export from the original browser location before moving files or hosting origins. Opening a new file may show different browser storage without deleting the original collection. The export file preserves raw saved content; an automatic import/replacement is intentionally not performed.

## Build and validation

`game-data.json` is the maintained data source embedded into the runnable HTML. From the workspace root:

```
node tools/build-production.cjs
node tests/regression.cjs --production
```

Validation uses an isolated Chrome profile: all 240 rows, tab navigation, exact variant behavior, unknown-key retention, reload persistence, backup/corrupt-save protection, bulk controls, filters and mobile widths 320/360/393/428. Production CSS and embedded image bytes are checked against the pinned original. No real user browser storage is used by the tests.

This package is for local review. GitHub main and the live deployment are unchanged.
