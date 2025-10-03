import Foundation
import Capacitor
import AVFoundation

@objc(MicrophonePlugin)
public class MicrophonePlugin: CAPPlugin {
    
    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private var isRecording = false
    
    @objc func startRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                // Configure audio session for recording
                let audioSession = AVAudioSession.sharedInstance()
                try audioSession.setCategory(.record, mode: .measurement, options: [])
                try audioSession.setActive(true)
                
                // Create audio engine
                self.audioEngine = AVAudioEngine()
                self.inputNode = self.audioEngine?.inputNode
                
                guard let inputNode = self.inputNode else {
                    call.reject("Failed to get input node")
                    return
                }
                
                // Install tap on input node
                let recordingFormat = inputNode.outputFormat(forBus: 0)
                inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, time in
                    self?.processAudioBuffer(buffer)
                }
                
                // Start audio engine
                try self.audioEngine?.start()
                self.isRecording = true
                
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to start recording: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func stopRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.audioEngine?.stop()
            self.inputNode?.removeTap(onBus: 0)
            self.isRecording = false
            
            // Deactivate audio session
            do {
                try AVAudioSession.sharedInstance().setActive(false)
            } catch {
                print("Failed to deactivate audio session: \(error)")
            }
            
            call.resolve(["success": true])
        }
    }
    
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameCount = Int(buffer.frameLength)
        
        // Calculate RMS
        var sum: Float = 0
        for i in 0..<frameCount {
            let sample = channelData[i]
            sum += sample * sample
        }
        let rms = sqrt(sum / Float(frameCount))
        
        // Send audio data to JavaScript
        DispatchQueue.main.async {
            self.notifyListeners("audioData", data: [
                "rms": rms,
                "samples": Array(UnsafeBufferPointer(start: channelData, count: frameCount))
            ])
        }
    }
}
