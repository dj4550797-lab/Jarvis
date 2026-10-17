# JARVIS — Phase 4: Device Diagnostics, Voice & Hardware Specification

**Version:** 1.0  
**Phase:** 4 (COMPLETED)  
**Parent Document:** [PLAN.md](file:///f:/Jarvis/docs/PLAN.md)  
**Requirements:** [JARVIS_Master_PRD.md](file:///f:/Jarvis/docs/JARVIS_Master_PRD.md) Section 12 & 13  
**Security Standards:** [SECURITY.md](file:///f:/Jarvis/docs/SECURITY.md) Section 12  

---

## 1. Objective

Enable JARVIS to perform device diagnostics (microphones, audio outputs, cameras, displays) and voice interaction (speech-to-text, text-to-speech) while enforcing strict hardware crash resistance, visible recording indicators, and explicit permission controls.

---

## 2. Architecture & Components

```
                Frontend UI (React 18 / WebView2)
   +---------------------+-------------------+---------------------+
   | Chat View with Voice| Devices & Hardware| Real-time Speech    |
   | Input & Read-Aloud  | Diagnostics View  | Synthesis & Recog   |
   +----------+----------+---------+---------+----------+----------+
              |                    |                    |
              v                    v                    v
       REST API: /voice     REST API: /devices   Web Speech API /
       (STT & TTS Adapters) (Hardware Inventory) Native MediaStream
              |                    |
              v                    v
      Voice Service        Device Detector
   (Mock / Local Whisper)  (WinMM / User32 / Registry / PnP)
```

### 2.1 Device Diagnostics (`backend/app/devices/`)
1. **Audio Inputs (Microphones):**
   - Enumerate via `winmm.dll` `waveInGetDevCapsW`.
   - Report channels, driver version, device name, and connection status.
2. **Audio Outputs (Speakers / Headphones):**
   - Enumerate via `winmm.dll` `waveOutGetDevCapsW`.
   - Report device name, stereo/multichannel support, and connection state.
3. **Displays & Screens:**
   - Query primary monitor and virtual screen bounds via `user32.dll` `GetSystemMetrics`.
   - Report resolution (e.g. 1366x768), monitor count, and virtual desktop size.
4. **Video & Cameras:**
   - Query video capture hardware via Windows DeviceClasses registry and PnP classes.
   - Report device names and availability.
5. **Permissions & Capabilities:**
   - Report status for `microphone`, `camera`, `screen_capture`, `audio_output`.
   - Enforce deny-by-default posture per SECURITY.md.

### 2.2 Voice Interaction (`backend/app/voice/`)
1. **Speech-to-Text (STT):**
   - Base interface `BaseSTTAdapter` with `transcribe(audio_bytes) -> dict`.
   - `MockSTTAdapter` for deterministic offline testing.
   - Browser client integration with Web Speech Recognition (`webkitSpeechRecognition`) for zero-latency local dictation.
2. **Text-to-Speech (TTS):**
   - Base interface `BaseTTSAdapter` with `synthesize(text, voice, speed) -> bytes`.
   - `MockTTSAdapter` providing deterministic audio stream generation (valid 16-bit WAV PCM).
   - Browser client integration with Web Speech Synthesis (`window.speechSynthesis`).
3. **Safety & Privacy Controls:**
   - Visible recording pulsation and speech output indicator.
   - User transcription review before executing sensitive commands (PRD 12.1).
   - Instant stop-recording and stop-playback controls.

---

## 3. Acceptance Checklist

- [x] Hardware detector reports audio inputs, outputs, screens, and cameras without crashing.
- [x] Missing devices or permission denials produce clear, user-friendly messages.
- [x] STT transcription and TTS synthesis endpoints implemented and tested.
- [x] Visible recording and playback states added to frontend.
- [x] Stop-recording and stop-playback controls verified.
- [x] Diagnostics screen (`DeviceDiagnosticsView`) displays hardware inventory and permission matrix.
- [x] Automated tests pass for devices, voice endpoints, and frontend components.
