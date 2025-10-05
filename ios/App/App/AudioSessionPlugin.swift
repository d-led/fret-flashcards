import Foundation
import Capacitor
import AVFoundation

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin {
    
    public static func register() {
        // Plugin is automatically registered by Capacitor
        // This method is here for explicit registration if needed
    }
    
    @objc func configureAudioSession(_ call: CAPPluginCall) {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            
            // Configure audio session for playback and recording
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetoothHFP])
            
            // Set preferred sample rate and buffer duration for better audio quality
            try audioSession.setPreferredSampleRate(44100.0)
            try audioSession.setPreferredIOBufferDuration(0.005) // 5ms buffer for low latency
            
            call.resolve()
        } catch {
            call.reject("Failed to configure audio session: \(error.localizedDescription)")
        }
    }
    
    @objc func activateAudioSession(_ call: CAPPluginCall) {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setActive(true, options: [])
            call.resolve()
        } catch {
            call.reject("Failed to activate audio session: \(error.localizedDescription)")
        }
    }
    
    @objc func deactivateAudioSession(_ call: CAPPluginCall) {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setActive(false, options: [])
            call.resolve()
        } catch {
            call.reject("Failed to deactivate audio session: \(error.localizedDescription)")
        }
    }
}
