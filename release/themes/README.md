# DroidAtlas Theme Engine v0.1 — isolated preview

This is a **separate development track**, based on production v1.2.6. It does **not** include the staged Fusion IGV changes from draft PR #8 or the pending Rebirth 40 verification in issue #7. Those remain queued for the next combined data release.

## What is working

- `Default` is the original Denver Broncos-inspired orange-and-blue Industrial Command design. Its compatibility stylesheet deliberately has zero visual overrides, preserving this established layout, colors, and every variant/rarity indicator.
- `Steel Night (Preview)` demonstrates an independent shell-color package. It never overrides semantic variant colors or acquired-history state.
- The theme selector lives inside the existing **ⓘ About** dialog so the default app layout is not rearranged.
- A validated same-origin `themes/manifest.json` registers packages. Each package has its own `theme.json` and `theme.css`; the engine allows only local CSS paths tied to validated IDs.
- Theme selection persists under **`droidatlas-theme-v1` only**. Rebirth level, Fusion recipes, collection keys such as `droidatlas-droidex-v1`, and saved acquisitions remain untouched. An invalid theme ID falls back safely to Default.
- The build copies `themes/` into `release/themes/` and includes all package files in a versioned service-worker cache for offline selection.
- A browser suite checks default appearance invariants, runtime switching, persistence, rollback, invalid stored values, offline usage, four mobile widths, and unchanged collection storage.

## Registry and packaging

To add a third theme in a future PR:

1. Create `themes/<id>/theme.json` and `themes/<id>/theme.css`.
2. Register the ID, visible name, and relative package paths in `themes/manifest.json`.
3. Build and test on a theme-specific development branch with `npm run build && npm test`.
4. Ensure selectors are scoped under `html[data-da-theme="<id>"]` and do not change game-data or the meaning of status/rarity colors.
5. Publish only when the separate theme work has been reviewed and merged with a coordinated release, including a new production service-worker cache key.

**Art assets and migration:** Production currently embeds its approved chrome/crystal assets in the legacy HTML for maximum backward compatibility. Theme files can reference artwork without changing that. Extracting those original assets into independent image files is a separate, higher-risk refactor and is **not claimed complete** here. Existing game-data modules remain unchanged and the theme runtime does not import them. This v0.1 builds the packaging, switching, and isolation foundation.

## Test and release guardrails

- The Default orange-and-blue style has zero overrides, so the original design is unchanged unless users voluntarily switch to Steel Night.
- This branch is a *preview* build. Do not deploy its v1.2.6-themed preview service worker directly to main; bump the cache and release number when scheduled.
- Never bundle accidental localStorage clearing or Droidex acquisition inference with a theme release.
- Core data updates continue separately (Fusion IGV draft PR #8, RB40 verification issue #7).

## Naming correction (2026-11-28)

- **Default:** Current, existing orange-and-blue **Denver Broncos-inspired** visual theme. This is the actual base application appearance; its CSS adds no changes.
- **Kyber Crystal (future separate theme):** The **faceted green Kyber crystal imagery with chrome sci-fi frames** is a distinct visual treatment. It must have actual image-based Kyber surfaces, not a relabeled copy of Default or a flat neon-green UI. It is not currently listed as a selectable theme.
- **Steel Night (Preview):** Optional shell-color variation to test Theme Engine switching.
- Old preview clients that saved `kyber-crystal` as their selected theme are migrated to `default` because that older label mistakenly referred to this existing orange-and-blue design. Collection history is not touched.
