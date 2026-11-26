package win.droidatlas.storageaudit;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Offline metadata-only scanner. It never opens file contents, deletes, renames, or uploads files.
 * Broad scan is opt-in Android MANAGE_EXTERNAL_STORAGE; folder mode is read-only SAF.
 */
public class MainActivity extends Activity {
    private static final int PICK_FOLDER = 701;
    private static final int EXPORT_CSV = 702;
    private static final int EXPORT_JSON = 703;
    private static final int MAX_VISITED = 300000;
    private static final int MAX_RESULTS = 5000;
    private static final int MAX_DEPTH = 45;
    private static final int SHOW_RESULTS = 80;
    private static final int BG = Color.rgb(7, 15, 27);
    private static final int PANEL = Color.rgb(15, 29, 45);
    private static final int WHITE = Color.rgb(230, 242, 251);
    private static final int MUTED = Color.rgb(157, 179, 199);
    private static final int CYAN = Color.rgb(68, 194, 239);
    private static final int AMBER = Color.rgb(255, 194, 115);
    private static final int GREEN = Color.rgb(111, 228, 164);

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean cancelled = new AtomicBoolean(false);
    private final List<AuditRecord> results = new ArrayList<>();
    private EditText termsInput;
    private TextView permissionText, status, countText;
    private LinearLayout resultsContainer;
    private Button fullButton, folderButton, csvButton, jsonButton, cancelButton;
    private volatile boolean running = false;
    private long scannedItems = 0, blockedDirectories = 0;
    private boolean resultsTruncated = false;
    private String scope = "Not scanned", scannedAt = "";
    private List<String> activeTerms = new ArrayList<>();

    private static final class AuditRecord {
        final String name, location, kind, label, reason;
        final long size, modified;
        AuditRecord(String name, String location, boolean directory, long size, long modified, String reason) {
            this.name = name;
            this.location = location;
            this.kind = directory ? "directory" : "file";
            this.size = size;
            this.modified = modified;
            this.reason = reason;
            this.label = MatchRules.label(name, directory);
        }
        JSONObject toJson() throws Exception {
            JSONObject obj = new JSONObject();
            obj.put("name", name);
            obj.put("location", location);
            obj.put("type", kind);
            obj.put("size_bytes", size >= 0 ? size : JSONObject.NULL);
            obj.put("modified_epoch_ms", modified > 0 ? modified : JSONObject.NULL);
            obj.put("review_label", label);
            obj.put("matched_because", reason);
            return obj;
        }
    }
    private static final class PendingFile {
        final File file;
        final int depth;
        final boolean matchedParent;
        PendingFile(File file, int depth, boolean matchedParent) {
            this.file = file;this.depth = depth;this.matchedParent = matchedParent;
        }
    }
    private static final class PendingDoc {
        final String documentId, path;
        final int depth;
        final boolean matchedParent;
        PendingDoc(String documentId, String path, int depth, boolean matchedParent) {
            this.documentId = documentId;this.path = path;this.depth = depth;this.matchedParent = matchedParent;
        }
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(24), dp(18), dp(36));
        scroll.addView(root);
        setContentView(scroll);

        label(root, "DROIDATLAS  //  UTILITY", 12, CYAN, Typeface.BOLD, 5);
        label(root, "Storage Auditor", 28, WHITE, Typeface.BOLD, 10);
        label(root, "Read-only file inventory  ·  v0.1.0", 14, MUTED, Typeface.NORMAL, 22);

        LinearLayout privacy = panel(root);
        label(privacy, "PRIVACY FIRST", 12, GREEN, Typeface.BOLD, 9);
        label(privacy, "No network access. No file contents are read. No files are deleted, renamed, or moved. Only matching names, paths, sizes, and dates appear in your report.", 14, WHITE, Typeface.NORMAL, 8);
        label(privacy, "Android prevents access to some private app folders. This scanner cannot see inside them.", 12, MUTED, Typeface.NORMAL, 0);

        label(root, "SEARCH TERMS", 13, CYAN, Typeface.BOLD, 9);
        termsInput = new EditText(this);
        termsInput.setSingleLine(false);
        termsInput.setMinLines(2);
        termsInput.setText(MatchRules.DEFAULT_TERMS);
        termsInput.setTextSize(15);
        termsInput.setTextColor(WHITE);
        termsInput.setHintTextColor(MUTED);
        termsInput.setBackground(rounded(PANEL, Color.rgb(44, 87, 117), 10));
        termsInput.setPadding(dp(12), dp(9), dp(12), dp(9));
        root.addView(termsInput, matchMargins(0, 0, 0, 8));
        label(root, "Names containing any term are included. Files inside matching folders are also included. To keep results focused, remove terms you don't need.", 12, MUTED, Typeface.NORMAL, 15);

        permissionText = label(root, "", 13, AMBER, Typeface.NORMAL, 8);
        fullButton = button(root, "SCAN SHARED STORAGE", true, () -> requestOrScanAll());
        folderButton = button(root, "CHOOSE A FOLDER (LIMITED ACCESS)", false, () -> chooseFolder());
        label(root, "The broad scan requests Android's 'All files access' setting. This permission can allow apps to modify shared files, but this utility intentionally contains no modification or deletion actions. You can revoke access afterward.", 12, MUTED, Typeface.NORMAL, 16);

        LinearLayout resultPanel = panel(root);
        label(resultPanel, "AUDIT RESULTS", 13, CYAN, Typeface.BOLD, 7);
        status = label(resultPanel, "No scan has run.", 14, WHITE, Typeface.NORMAL, 8);
        countText = label(resultPanel, "", 12, MUTED, Typeface.NORMAL, 4);
        cancelButton = button(resultPanel, "CANCEL SCAN", false, () -> cancelled.set(true));
        cancelButton.setVisibility(View.GONE);
        csvButton = button(resultPanel, "EXPORT CSV REPORT", true, () -> export(false));
        jsonButton = button(resultPanel, "EXPORT JSON REPORT", false, () -> export(true));
        csvButton.setEnabled(false);
        jsonButton.setEnabled(false);
        resultsContainer = new LinearLayout(this);
        resultsContainer.setOrientation(LinearLayout.VERTICAL);
        resultPanel.addView(resultsContainer, matchMargins(0, 4, 0, 0));
        label(root, "REVIEW BEFORE DELETION", 12, AMBER, Typeface.BOLD, 8);
        label(root, "'REVIEW OLD BUILD' is not a deletion instruction. Keep at least one current Droidex collection backup. Do not clear Chrome site data or uninstall your installed DroidAtlas app.", 13, MUTED, Typeface.NORMAL, 0);
        updatePermission();
    }

    @Override protected void onResume() { super.onResume(); if (permissionText != null) updatePermission(); }

    private void updatePermission() {
        boolean granted = Build.VERSION.SDK_INT >= 30 && Environment.isExternalStorageManager();
        permissionText.setText(granted ? "Shared-storage permission: GRANTED" : "Shared-storage permission: NOT GRANTED (optional)");
        permissionText.setTextColor(granted ? GREEN : AMBER);
    }

    private void requestOrScanAll() {
        if (running) return;
        if (Build.VERSION.SDK_INT < 30) {
            Toast.makeText(this,"Use the folder picker on this Android version.",Toast.LENGTH_LONG).show();
            return;
        }
        if (!Environment.isExternalStorageManager()) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            } catch (Exception e) {
                startActivity(new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION));
            }
            Toast.makeText(this,"Grant access only if you want the broad scan, then return and tap Scan again.",Toast.LENGTH_LONG).show();
            return;
        }
        List<File> roots = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        seen.add(Environment.getExternalStorageDirectory().getAbsolutePath());
        File[] external = getExternalFilesDirs(null);
        if (external != null) for (File privateDir : external) {
            if (privateDir == null) continue;
            String path = privateDir.getAbsolutePath();
            int cut = path.indexOf("/Android/");
            if (cut > 0) seen.add(path.substring(0, cut));
        }
        for (String path : seen) roots.add(new File(path));
        begin("Shared storage", () -> scanFiles(roots));
    }

    private void chooseFolder() {
        if (running) return;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(intent, PICK_FOLDER);
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null) return;
        Uri uri = data.getData();
        if (uri == null) return;
        if (request == PICK_FOLDER) {
            try { getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); }
            catch (SecurityException ignored) { /* Session-only read grant still works. */ }
            begin("Selected folder", () -> scanDocumentTree(uri));
        } else if (request == EXPORT_CSV || request == EXPORT_JSON) {
            final boolean json = request == EXPORT_JSON;
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                if (out == null) throw new IllegalStateException("Cannot open chosen document");
                byte[] payload = (json ? makeJsonReport() : makeCsvReport()).getBytes(StandardCharsets.UTF_8);
                out.write(payload);
                Toast.makeText(this,"Report saved (" + payload.length + " bytes)",Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(this,"Export failed: " + e.getMessage(),Toast.LENGTH_LONG).show();
            }
        }
    }

    private List<String> terms() {
        return MatchRules.parseTerms(termsInput.getText().toString());
    }

    private void begin(String source, Runnable action) {
        if (running) return;
        List<String> requestedTerms = terms();
        if (requestedTerms.isEmpty()) {
            Toast.makeText(this,"Enter at least one search term with 2+ characters.",Toast.LENGTH_LONG).show();
            return;
        }
        activeTerms = requestedTerms;
        running = true;
        cancelled.set(false);
        results.clear();
        scannedItems = 0;
        blockedDirectories = 0;
        resultsTruncated = false;
        scope = source;
        scannedAt = utcNow();
        fullButton.setEnabled(false);
        folderButton.setEnabled(false);
        csvButton.setEnabled(false);
        jsonButton.setEnabled(false);
        termsInput.setEnabled(false);
        cancelButton.setVisibility(View.VISIBLE);
        resultsContainer.removeAllViews();
        status.setText("Scanning " + source + "…");
        countText.setText("Nothing deleted or uploaded.");
        worker.execute(() -> {
            String error = null;
            try { action.run(); } catch (Exception e) { error = e.getClass().getSimpleName() + ": " + e.getMessage(); }
            final String finalError = error;
            runOnUiThread(() -> finish(finalError));
        });
    }

    private void add(String name, String location, boolean isDir, long size, long modified, String reason) {
        if (results.size() >= MAX_RESULTS) { resultsTruncated = true; cancelled.set(true); return; }
        results.add(new AuditRecord(name, location, isDir, size, modified, reason));
    }

    private void reportProgress() {
        if (scannedItems % 800 != 0) return;
        final long seen = scannedItems;
        final int matches = results.size();
        runOnUiThread(() -> {
            if (running) countText.setText(seen + " items inspected · " + matches + " matches");
        });
    }

    private void scanFiles(List<File> roots) {
        List<String> needles = activeTerms;
        ArrayDeque<PendingFile> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        for (File root : roots) if (root.isDirectory()) queue.add(new PendingFile(root, 0, false));
        while (!queue.isEmpty() && !cancelled.get() && scannedItems < MAX_VISITED) {
            PendingFile current = queue.removeFirst();
            File folder = current.file;
            if (current.depth > MAX_DEPTH) { blockedDirectories++; continue; }
            String canonical;
            try { canonical = folder.getCanonicalPath(); } catch (Exception e) { blockedDirectories++; continue; }
            if (!visited.add(canonical)) continue;
            File[] entries;
            try { entries = folder.listFiles(); } catch (SecurityException e) { entries = null; }
            if (entries == null) { blockedDirectories++; continue; }
            for (File item : entries) {
                if (cancelled.get() || scannedItems >= MAX_VISITED) break;
                scannedItems++;
                reportProgress();
                try {
                    if (Files.isSymbolicLink(item.toPath())) continue;
                    boolean directory = item.isDirectory();
                    if (!directory && !item.isFile()) continue;
                    String name = item.getName();
                    boolean own = MatchRules.matches(name, needles);
                    boolean inherited = current.matchedParent;
                    if (own || inherited) add(name, item.getAbsolutePath(), directory,
                        directory ? -1 : item.length(), item.lastModified(), own ? "name" : "inside matching folder");
                    if (directory && current.depth < MAX_DEPTH && !item.getAbsolutePath().matches(".*/Android/(data|obb)(/.*)?")) {
                        queue.addLast(new PendingFile(item, current.depth + 1, own || inherited));
                    }
                } catch (SecurityException e) { blockedDirectories++; }
            }
        }
        if (scannedItems >= MAX_VISITED) resultsTruncated = true;
    }

    private void scanDocumentTree(Uri tree) {
        ContentResolver resolver = getContentResolver();
        List<String> needles = activeTerms;
        String rootId = DocumentsContract.getTreeDocumentId(tree);
        String prettyRoot = "Picked: " + rootId;
        ArrayDeque<PendingDoc> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        queue.add(new PendingDoc(rootId, prettyRoot, 0, MatchRules.matches(rootId, needles)));
        final String[] projection = {
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_SIZE,
            DocumentsContract.Document.COLUMN_LAST_MODIFIED
        };
        while (!queue.isEmpty() && !cancelled.get() && scannedItems < MAX_VISITED) {
            PendingDoc folder = queue.removeFirst();
            if (folder.depth > MAX_DEPTH || !visited.add(folder.documentId)) continue;
            Uri childUri = DocumentsContract.buildChildDocumentsUriUsingTree(tree, folder.documentId);
            try (Cursor cursor = resolver.query(childUri, projection, null, null, null)) {
                if (cursor == null) { blockedDirectories++; continue; }
                int idCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
                int nameCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DISPLAY_NAME);
                int typeCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE);
                int sizeCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_SIZE);
                int modifiedCol = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_LAST_MODIFIED);
                while (cursor.moveToNext() && !cancelled.get() && scannedItems < MAX_VISITED) {
                    scannedItems++;
                    reportProgress();
                    String id = cursor.getString(idCol);
                    String name = cursor.getString(nameCol);
                    String mime = cursor.getString(typeCol);
                    if (id == null || name == null) continue;
                    boolean directory = DocumentsContract.Document.MIME_TYPE_DIR.equals(mime);
                    boolean own = MatchRules.matches(name, needles);
                    boolean inherited = folder.matchedParent;
                    String path = folder.path + "/" + name;
                    if (own || inherited) add(name, path, directory,
                        cursor.isNull(sizeCol) ? -1 : cursor.getLong(sizeCol),
                        cursor.isNull(modifiedCol) ? 0 : cursor.getLong(modifiedCol),
                        own ? "name" : "inside matching folder");
                    if (directory && folder.depth < MAX_DEPTH)
                        queue.addLast(new PendingDoc(id, path, folder.depth + 1, own || inherited));
                }
            } catch (Exception e) { blockedDirectories++; }
        }
        if (scannedItems >= MAX_VISITED) resultsTruncated = true;
    }

    private void finish(String error) {
        running = false;
        fullButton.setEnabled(true);
        folderButton.setEnabled(true);
        termsInput.setEnabled(true);
        cancelButton.setVisibility(View.GONE);
        csvButton.setEnabled(true);
        jsonButton.setEnabled(true);
        boolean limited = resultsTruncated || cancelled.get();
        status.setText((error != null ? "Scan interrupted: " + error : limited ? "Partial scan completed" : "Scan completed") +
            ": " + results.size() + " matching items.");
        countText.setText(scannedItems + " items inspected · " + blockedDirectories + " inaccessible folders" +
            (limited ? " · PARTIAL report (limit/cancel reached)" : "") + ". No files changed.");
        resultsContainer.removeAllViews();
        if (results.isEmpty()) {
            label(resultsContainer,"No matches. Consider a broader term or another folder. Not all app-private storage is accessible.",13,MUTED,Typeface.NORMAL,3);
            return;
        }
        label(resultsContainer,"Showing " + Math.min(results.size(), SHOW_RESULTS) + " of " + results.size() +
            ". Export CSV/JSON to see every result. Names and paths may include private details; review before sharing.",12,MUTED,Typeface.NORMAL,8);
        int count = 0;
        for (AuditRecord r : results) {
            if (count++ == SHOW_RESULTS) break;
            LinearLayout row = panel(resultsContainer);
            label(row, r.label, 11, r.label.startsWith("KEEP") ? GREEN : r.label.contains("OLD") ? AMBER : CYAN, Typeface.BOLD, 4);
            label(row, r.name, 15, WHITE, Typeface.BOLD, 4);
            label(row, r.location, 11, MUTED, Typeface.NORMAL, 3);
            label(row, r.kind + " · " + humanSize(r.size) + " · " + r.reason, 11, MUTED, Typeface.NORMAL, 0);
        }
    }

    private void export(boolean json) {
        if (running) { Toast.makeText(this,"Finish the scan first.",Toast.LENGTH_SHORT).show();return; }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(json ? "application/json" : "text/csv");
        intent.putExtra(Intent.EXTRA_TITLE, "DroidAtlas-storage-audit-" +
            new SimpleDateFormat("yyyyMMdd-HHmm",Locale.US).format(new Date()) + (json ? ".json" : ".csv"));
        startActivityForResult(intent, json ? EXPORT_JSON : EXPORT_CSV);
    }

    private String makeCsvReport() {
        StringBuilder out = new StringBuilder("name,location,type,size_bytes,modified_utc,review_label,matched_because\r\n");
        for (AuditRecord r : results) {
            List<String> columns = Arrays.asList(r.name, r.location, r.kind,
                r.size < 0 ? "" : Long.toString(r.size), r.modified > 0 ? iso(r.modified) : "", r.label, r.reason);
            for (int i = 0; i < columns.size(); i++) {
                if (i > 0) out.append(',');
                out.append(MatchRules.csv(columns.get(i)));
            }
            out.append("\r\n");
        }
        return out.toString();
    }

    private String makeJsonReport() throws Exception {
        JSONObject json = new JSONObject();
        json.put("tool","DroidAtlas Storage Auditor");
        json.put("tool_version","0.1.0");
        json.put("scanned_at_utc",scannedAt);
        json.put("scope",scope);
        json.put("search_terms",String.join(", ",activeTerms));
        json.put("inspected_items",scannedItems);
        json.put("inaccessible_directories",blockedDirectories);
        json.put("partial",resultsTruncated || cancelled.get());
        json.put("warning","Read-only metadata report. Review every candidate manually before deleting anything. Protect collection backups and browser site data.");
        JSONArray rows = new JSONArray();
        for (AuditRecord r : results) rows.put(r.toJson());
        json.put("matches",rows);
        return json.toString(2);
    }

    private static String utcNow() { return iso(System.currentTimeMillis()); }
    private static String iso(long milliseconds) {
        SimpleDateFormat date = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'",Locale.US);
        date.setTimeZone(TimeZone.getTimeZone("UTC"));
        return date.format(new Date(milliseconds));
    }
    private static String humanSize(long bytes) {
        if (bytes < 0) return "size unavailable";
        if (bytes < 1024) return bytes + " B";
        double amount = bytes;
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int index = 0;
        while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index++; }
        return String.format(Locale.US,"%.1f %s",amount,units[index]);
    }

    private int dp(float n) { return (int)(n * getResources().getDisplayMetrics().density + .5f); }
    private LinearLayout.LayoutParams matchMargins(int top, int left, int right, int bottom) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1,-2);
        p.setMargins(dp(left),dp(top),dp(right),dp(bottom));
        return p;
    }
    private GradientDrawable rounded(int fill, int border, int corner) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fill);
        gd.setCornerRadius(dp(corner));
        gd.setStroke(dp(1), border);
        return gd;
    }
    private LinearLayout panel(LinearLayout parent) {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setPadding(dp(14),dp(14),dp(14),dp(14));
        p.setBackground(rounded(PANEL,Color.rgb(33,68,95),12));
        parent.addView(p,matchMargins(0,0,0,15));
        return p;
    }
    private TextView label(LinearLayout parent, String text, int size, int color, int weight, int bottom) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextSize(size);
        v.setTextColor(color);
        v.setTypeface(Typeface.DEFAULT, weight);
        parent.addView(v, matchMargins(0,0,0,bottom));
        return v;
    }
    private Button button(LinearLayout parent, String text, boolean primary, Runnable callback) {
        Button b = new Button(this);
        b.setAllCaps(false);
        b.setText(text);
        b.setTextSize(14);
        b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        b.setTextColor(primary ? BG : WHITE);
        b.setBackground(rounded(primary ? CYAN : Color.rgb(24,45,65), primary ? CYAN : Color.rgb(60,101,129), 9));
        b.setPadding(dp(12),dp(8),dp(12),dp(8));
        b.setMinHeight(dp(48));
        b.setGravity(Gravity.CENTER);
        parent.addView(b,matchMargins(0,0,0,8));
        b.setOnClickListener(v -> callback.run());
        return b;
    }

    @Override protected void onDestroy() {
        cancelled.set(true);
        worker.shutdownNow();
        super.onDestroy();
    }
}
