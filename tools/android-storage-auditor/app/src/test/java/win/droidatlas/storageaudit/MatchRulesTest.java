package win.droidatlas.storageaudit;

import org.junit.Test;
import java.util.List;
import static org.junit.Assert.*;

public class MatchRulesTest {
    @Test public void matchesRelevantNamesWithoutScanningContents() {
        List<String> words = MatchRules.parseTerms(MatchRules.DEFAULT_TERMS);
        assertTrue(MatchRules.matches("DroidAtlas_Core_Fusion_v63.html", words));
        assertTrue(MatchRules.matches("da_backup.zip", words));
        assertTrue(MatchRules.matches("Kyber-green.png", words));
        assertFalse(MatchRules.matches("holiday-photo.jpg", words));
    }
    @Test public void protectsBackups() {
        assertEquals("KEEP COLLECTION BACKUP", MatchRules.label("DroidAtlas-collection-backup.json", false));
        assertEquals("REVIEW OLD BUILD", MatchRules.label("DroidAtlas_v58.html", false));
        assertEquals("REVIEW FOLDER", MatchRules.label("DroidAtlas-old", true));
        assertEquals("REVIEW ARTWORK / SCREENSHOT", MatchRules.label("kyber-frame.png", false));
    }
    @Test public void csvEscapesDoubleQuotesAndFormulas() {
        assertEquals("\"normal.csv\"",MatchRules.csv("normal.csv"));
        assertEquals("\"'=-malicious\"",MatchRules.csv("=-malicious"));
        assertEquals("\"A\"\"B\"",MatchRules.csv("A\"B"));
    }
    @Test public void ignoresEmptySearchAndDeduplicates() {
        List<String> xs=MatchRules.parseTerms(" , DA_, da_, , DroidAtlas, x");
        assertEquals(2,xs.size());
        assertEquals("da_",xs.get(0));
    }
}
