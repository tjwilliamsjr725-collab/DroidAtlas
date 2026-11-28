# DroidAtlas Theme Engine v0.1 — isolated preview

This is a **separate development track**, based on production v1.2.6. It does **not** include the staged Fusion IGV changes from draft PR #8 or the pending Rebirth 40 verification in issue #7. Those remain queued for the next combined data release.

## What is working

- `Kyber Crystal` is the default and preserves all approved chrome/crystal artwork and original CSS, including colored variant/rarity indicators. Its compatibility stylesheet deliberately has no visual overrides.
- `Steel Night (Preview)` demonstrates an independent shell-color package. It never overrides semantic variant colors or acquired-history state.
- The theme selector lives inside the existing **ⓘ About** dialog so the default app layout is not rearranged.
- A validated same-origin `themes/manifest.json` registers packages. Each package has its own `theme.json` and `theme.css`; the engine allows only local CSS paths tied to validated IDs.
- Theme selection persists under **`droidatlas-theme-v1` only**. Rebirth level, Fusion recipes, collection keys such as `droidatlas-droidex-v1`, and saved acquisitions remain untouched. An invalid theme ID falls back safely to Kyber Crystal.
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

- The default Kyber style has zero overrides, so the original visual design is unchanged unless users voluntarily switch to Steel Night.
- This branch is a *preview* build. Do not deploy its v1.2.6-themed preview service worker directly to main; bump the cache and release number when scheduled.
- Never bundle accidental localStorage clearing or Droidex acquisition inference with a theme release.
- Core data updates continue separately (Fusion IGV draft PR #8, RB40 verification issue #7).
