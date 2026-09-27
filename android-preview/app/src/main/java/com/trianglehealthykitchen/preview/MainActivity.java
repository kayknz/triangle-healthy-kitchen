package com.trianglehealthykitchen.preview;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_ROOT = "/assets/";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(248, 250, 252));
        setContentView(webView);

        if (Build.VERSION.SDK_INT >= 35) {
            webView.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets systemBars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
                return insets;
            });
            webView.requestApplyInsets();
        }

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.setWebViewClient(new PreviewWebViewClient());
        webView.loadUrl("https://" + APP_HOST + APP_ROOT + "index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }

    private final class PreviewWebViewClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!APP_HOST.equalsIgnoreCase(uri.getHost())) return super.shouldInterceptRequest(view, request);

            String path = uri.getPath();
            if (path == null) return notFound();
            if (path.startsWith("/api/")) return apiUnavailable();
            if (!path.startsWith(APP_ROOT)) return notFound();

            String assetPath = path.substring(APP_ROOT.length());
            if (assetPath.isEmpty()) assetPath = "index.html";
            if (assetPath.contains("..")) return notFound();

            try {
                InputStream stream = getAssets().open(assetPath);
                return new WebResourceResponse(mimeType(assetPath), "UTF-8", stream);
            } catch (IOException error) {
                return notFound();
            }
        }

        private WebResourceResponse apiUnavailable() {
            String body = "{\"error\":\"Preview APK uses preserved demonstration data\"}";
            return new WebResourceResponse(
                "application/json",
                "UTF-8",
                503,
                "Preview mode",
                java.util.Collections.emptyMap(),
                new ByteArrayInputStream(body.getBytes(java.nio.charset.StandardCharsets.UTF_8))
            );
        }

        private WebResourceResponse notFound() {
            return new WebResourceResponse(
                "text/plain",
                "UTF-8",
                404,
                "Not found",
                java.util.Collections.emptyMap(),
                new ByteArrayInputStream(new byte[0])
            );
        }

        private String mimeType(String path) {
            String extension = MimeTypeMap.getFileExtensionFromUrl(path).toLowerCase(Locale.ROOT);
            String detected = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            if (detected != null) return detected;
            if ("js".equals(extension)) return "text/javascript";
            if ("json".equals(extension)) return "application/json";
            if ("css".equals(extension)) return "text/css";
            return "application/octet-stream";
        }
    }
}
