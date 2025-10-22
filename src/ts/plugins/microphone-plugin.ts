import { registerPlugin } from "@capacitor/core";

export interface MicrophonePlugin {
  startRecording(): Promise<{ success: boolean }>;
  stopRecording(): Promise<{ success: boolean }>;
  addListener(eventName: "audioData", listenerFunc: (data: { rms: number; samples: number[] }) => void): Promise<{ remove: () => void }>;
}

const MicrophonePlugin = registerPlugin<MicrophonePlugin>("MicrophonePlugin");

export default MicrophonePlugin;
