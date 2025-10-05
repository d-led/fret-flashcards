import UIKit
import WebKit
import Capacitor

class ViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure WKWebView for microphone access
        if let webView = self.webView as? WKWebView {
            webView.navigationDelegate = self
        }
    }
}

// MARK: - WKNavigationDelegate
extension ViewController: WKNavigationDelegate {
    
    // Handle media capture permissions for iOS 15+
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView, 
                 requestMediaCapturePermissionForOrigin origin: WKSecurityOrigin, 
                 initiatedByFrame frame: WKFrameInfo, 
                 type: WKMediaCaptureType, 
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        
        print("🎤 Media capture permission requested for type: \(type.rawValue)")
        
        if type == .microphone {
            // Grant microphone permission
            print("🎤 Granting microphone permission")
            decisionHandler(.grant)
        } else {
            // Deny other media types
            decisionHandler(.deny)
        }
    }
}
