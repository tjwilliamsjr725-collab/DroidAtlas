# DroidAtlas Storage Auditor — Android v0.1

A **separate, read-only Android utility** for finding old DroidAtlas files on a phone. It does **not** replace the DroidAtlas PWA, access Droidex browser storage, or modify the live DroidAtlas repository's application files.

## What the app does

- Searches filenames and enclosing folder names for a configurable list (default: `DroidAtlas, Droidex, Kyber, VDAX, DA_`).
- Shows matching paths, sizes, modification dates (in exported reports), and a **review-only** classification.
- Exports a complete CSV or JSON inventory through Android's save-document dialog.
- Has **no internet permission**, no telemetry, no deletion controls, and never opens file contents.
- Flags filenames such as `DroidAtlas-collection-backup.json` as **KEEP COLLECTION BACKUP**.
- Caps traversal at 300,000 inspected entries and 5,000 matching entries. Canceled or capped scans are marked partial.

## Scan modes

**Choose a folder (limited access)** uses Android's system folder picker. Grant read access only to that folder. Some Android versions block selecting the Downloads root or the top of internal storage. If you cannot select a folder, choose an allowed subfolder instead.

**Scan shared storage** requires explicitly granting Android **All files access** to this utility in system Settings. The Android permission technically enables broad shared-storage write capability, even though this app's implemented operations are strictly read-only. You can revoke this permission after producing the report. This is an optional sideload-only capability; it would require special Google Play review if ever distributed through Play.

Neither mode can read the private data of Chrome/DroidAtlas, or most protected `Android/data` and `Android/obb` locations. Do **not** clear browser site data, uninstall your installed DroidAtlas app, or delete collection backups. Inspect each candidate before deletion.

## Installation and testing

1. Download the **debug APK** from the GitHub Actions build artifact for this utility; see `.github/workflows/android-auditor.yml` for the build workflow.
2. On the Samsung phone, open the APK and follow Android's installation prompts for your browser/files app. Don't disable Play Protect globally. If the device declines the install, stop and report the exact error.
3. Launch **DroidAtlas Storage Auditor**. Initially use **Choose a folder** on a test folder containing `DroidAtlas_v58.html` and `DroidAtlas-collection-backup.json`.
4. Verify that the old HTML is labeled **REVIEW OLD BUILD** and the backup is labeled **KEEP COLLECTION BACKUP**. Nothing should be deleted.
5. Export CSV or JSON; check the content locally. Then optionally run the full shared-storage scan.
6. Upload the generated report to the ChatGPT conversation for review. Names and paths may contain personal details, so inspect the report before sharing.

The `DroidAtlas` PWA is not modified by installing this tool. This is a prototype and has not been tested on a physical Galaxy device.

## Build from source

Requirements: JDK 17, Android SDK platform 35, Android Gradle Plugin 8.8.2, Gradle 8.10.2.

Open the folder as an Android Studio project and select **Run** or execute:

```
gradle --no-daemon :app:testDebugUnitTest :app:assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk` (debug-signed; suitable for personal testing only).

The JVM tests cover matching, backup protection, and CSV escaping. The GitHub Actions workflow compiles and runs tests, then provides an APK build artifact. Manual on-phone testing is still required before calling the scanner fully verified.

## Security / code review notes

- No `INTERNET` permission is requested.
- No file delete, rename, write, or move routines exist; the **only** write path is user-approved report export (`ACTION_CREATE_DOCUMENT`).
- `MANAGE_EXTERNAL_STORAGE` is optional and initiated from the scan button.
- No file content is read; only file metadata and filenames are examined.
- Saved reports can disclose local paths and filenames; review them before sharing.
- The scanner's report is advice only, not an automatic cleanup plan.
- Android may block scanning protected and private directories even when All files access is granted.

**Development rule:** separate branch → automated tests → release only after passing tests. No changes to DroidAtlas production without its own independent tests.
