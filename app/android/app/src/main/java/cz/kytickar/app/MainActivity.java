package cz.kytickar.app;

import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {

    private String pendingBase64Data = null;
    private ActivityResultLauncher<String> createDocumentLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        createDocumentLauncher = registerForActivityResult(
            new ActivityResultContracts.CreateDocument("*/*"),
            uri -> {
                if (uri != null && pendingBase64Data != null) {
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        byte[] bytes = android.util.Base64.decode(pendingBase64Data, android.util.Base64.DEFAULT);
                        if (bytes != null && os != null) {
                            os.write(bytes);
                            os.flush();
                        }
                        Toast.makeText(this, "Soubor úspěšně uložen", Toast.LENGTH_SHORT).show();
                        notifySaveResult(true, uri.toString(), false);
                    } catch (Exception e) {
                        Toast.makeText(this, "Chyba při ukládání: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        notifySaveResult(false, null, false);
                    }
                } else {
                    notifySaveResult(false, null, true);
                }
                pendingBase64Data = null;
            }
        );

        setupBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupBridge();
    }

    private void setupBridge() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new FileSaverBridge(), "AndroidFileSaver");
        }
    }

    private void notifySaveResult(boolean success, String uri, boolean cancelled) {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().post(() -> {
                String safeUri = uri != null ? uri.replace("'", "\\'") : "";
                String js = "window.dispatchEvent(new CustomEvent('android-file-saved', { detail: { success: "
                    + success + ", uri: '" + safeUri + "', cancelled: " + cancelled + " } }));";
                this.bridge.getWebView().evaluateJavascript(js, null);
            });
        }
    }

    public class FileSaverBridge {
        @JavascriptInterface
        public void saveFile(String filename, String mimeType, String base64Data) {
            runOnUiThread(() -> {
                pendingBase64Data = base64Data;
                createDocumentLauncher.launch(filename);
            });
        }
    }
}
