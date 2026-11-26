package win.droidatlas.storageaudit;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/** Pure, offline matching and advisory labeling. Never authorizes deletion. */
public final class MatchRules {
    private MatchRules() { }

    public static final String DEFAULT_TERMS = "DroidAtlas, Droidex, Kyber, VDAX, DA_";
    private static final int MAX_TERMS = 20;

    public static List<String> parseTerms(String commaSeparated) {
        if (commaSeparated == null) return Collections.emptyList();
        List<String> found = new ArrayList<>();
        for (String item : commaSeparated.split(",")) {
            String word = item.trim().toLowerCase(Locale.ROOT);
            if (word.length() < 2 || found.contains(word)) continue;
            found.add(word);
            if (found.size() == MAX_TERMS) break;
        }
        return found;
    }

    public static boolean matches(String name, List<String> terms) {
        if (name == null) return false;
        String lower = name.toLowerCase(Locale.ROOT);
        for (String term : terms) if (lower.contains(term)) return true;
        return false;
    }

    public static String label(String name, boolean directory) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
        if (directory) return "REVIEW FOLDER";
        if (lower.endsWith(".json") && (lower.contains("backup") || lower.contains("collection") || lower.contains("export"))) {
            return "KEEP COLLECTION BACKUP";
        }
        if (lower.endsWith(".html") || lower.endsWith(".htm") || lower.endsWith(".zip") || lower.endsWith(".apk")) {
            return "REVIEW OLD BUILD";
        }
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
            return "REVIEW ARTWORK / SCREENSHOT";
        }
        return "REVIEW FILE";
    }

    /** Protect spreadsheet users from filename/path formula injection. */
    public static String csv(String value) {
        String v = value == null ? "" : value.replace('\r', ' ').replace('\n', ' ');
        if (!v.isEmpty() && Arrays.asList('=', '+', '-', '@', '\t').contains(v.charAt(0))) v = "'" + v;
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
