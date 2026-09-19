package com.trianglehealthykitchen.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        // Optimize WebView performance once the bridge is initialized
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            
            // Enable hardware acceleration at the view level
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Tweak cache and rendering
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setDomStorageEnabled(true);
            
            // Improve touch responsiveness by disabling long-press on some elements if needed
            // (handled mostly by CSS, but can be influenced here)
            webView.setHapticFeedbackEnabled(false);
        }
    }
}
