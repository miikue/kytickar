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
    private OutputStream activeOutputStream = null;
    private ActivityResultLauncher<String> createDocumentLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        createDocumentLauncher = registerForActivityResult(
            new ActivityResultContracts.CreateDocument("*/*"),
            uri -> {
                if (uri != null) {
                    try {
                        OutputStream os = getContentResolver().openOutputStream(uri);
                        if (pendingBase64Data != null) {
                            if (os != null) {
                                byte[] bytes = android.util.Base64.decode(pendingBase64Data, android.util.Base64.DEFAULT);
                                if (bytes != null) {
                                    os.write(bytes);
                                    os.flush();
                                }
                                os.close();
                            }
                            pendingBase64Data = null;
                            Toast.makeText(this, "Soubor úspěšně uložen", Toast.LENGTH_SHORT).show();
                            notifySaveResult(true, uri.toString(), false);
                        } else {
                            activeOutputStream = os;
                            notifyReady(true, uri.toString(), false);
                        }
                    } catch (Exception e) {
                        pendingBase64Data = null;
                        closeActiveStream();
                        Toast.makeText(this, "Chyba při ukládání: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        notifySaveResult(false, null, false);
                    }
                } else {
                    pendingBase64Data = null;
                    closeActiveStream();
                    notifySaveResult(false, null, true);
                }
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

    private void closeActiveStream() {
        if (activeOutputStream != null) {
            try {
                activeOutputStream.close();
            } catch (Exception ignored) {}
            activeOutputStream = null;
        }
    }

    private void notifyReady(boolean ready, String uri, boolean cancelled) {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().post(() -> {
                String safeUri = uri != null ? uri.replace("'", "\\'") : "";
                String js = "window.dispatchEvent(new CustomEvent('android-save-ready', { detail: { ready: "
                    + ready + ", uri: '" + safeUri + "', cancelled: " + cancelled + " } }));";
                this.bridge.getWebView().evaluateJavascript(js, null);
            });
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
                closeActiveStream();
                pendingBase64Data = base64Data;
                createDocumentLauncher.launch(filename);
            });
        }

        @JavascriptInterface
        public void startSave(String filename, String mimeType) {
            runOnUiThread(() -> {
                closeActiveStream();
                pendingBase64Data = null;
                createDocumentLauncher.launch(filename);
            });
        }

        @JavascriptInterface
        public boolean writeChunk(String base64Chunk) {
            if (activeOutputStream == null) return false;
            try {
                byte[] bytes = android.util.Base64.decode(base64Chunk, android.util.Base64.DEFAULT);
                if (bytes != null) {
                    activeOutputStream.write(bytes);
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void finishSave(boolean success) {
            runOnUiThread(() -> {
                try {
                    if (activeOutputStream != null) {
                        activeOutputStream.flush();
                        activeOutputStream.close();
                    }
                    if (success) {
                        Toast.makeText(MainActivity.this, "Soubor úspěšně uložen", Toast.LENGTH_SHORT).show();
                        notifySaveResult(true, "", false);
                    } else {
                        notifySaveResult(false, null, false);
                    }
                } catch (Exception e) {
                    notifySaveResult(false, null, false);
                } finally {
                    activeOutputStream = null;
                }
            });
        }
    }
}
