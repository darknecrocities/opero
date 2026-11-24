import Foundation
import AVFoundation
import Speech
#if canImport(ScreenCaptureKit)
import ScreenCaptureKit
#endif

// OPERO Native macOS OS-Level Audio Capture & On-Device Transcription Helper
// Modes:
//   opero-audio-tap record <output.wav> <system_and_mic|mic_only|system_only>
//   opero-audio-tap transcribe <input.wav> <en-US|ja-JP|fil-PH>

func transcribeWav(path: String, localeId: String) {
    let url = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: path) else {
        fputs("Audio file not found: \(path)\n", stderr)
        exit(2)
    }
    let resolvedLocale = localeId == "fil-PH" ? "en-US" : localeId
    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: resolvedLocale)) else {
        print("[]")
        exit(0)
    }
    let semaphore = DispatchSemaphore(value: 0)
    let request = SFSpeechURLRecognitionRequest(url: url)
    request.requiresOnDeviceRecognition = recognizer.supportsOnDeviceRecognition
    request.shouldReportPartialResults = false

    var segments: [[String: Any]] = []
    recognizer.recognitionTask(with: request) { result, error in
        if let result = result, result.isFinal {
            let text = result.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
            if !text.isEmpty {
                let duration = result.bestTranscription.segments.last.map { $0.timestamp + $0.duration } ?? 5.0
                segments.append([
                    "startSec": 0.0,
                    "endSec": duration,
                    "speaker": "Speaker",
                    "text": text
                ])
            }
            semaphore.signal()
        } else if error != nil {
            semaphore.signal()
        }
    }
    _ = semaphore.wait(timeout: .now() + 25.0)
    if let data = try? JSONSerialization.data(withJSONObject: segments),
       let json = String(data: data, encoding: .utf8) {
        print(json)
    } else {
        print("[]")
    }
    exit(0)
}

func recordAudio(outputPath: String, mode: String) {
    let url = URL(fileURLWithPath: outputPath)
    let engine = AVAudioEngine()
    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    guard format.sampleRate > 0 else {
        fputs("No active microphone input format available\n", stderr)
        exit(3)
    }

    let settings: [String: Any] = [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVSampleRateKey: 16000.0,
        AVNumberOfChannelsKey: 1,
        AVLinearPCMBitDepthKey: 16,
        AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false
    ]

    guard let audioFile = try? AVAudioFile(forWriting: url, settings: settings) else {
        fputs("Unable to open WAV file for writing: \(outputPath)\n", stderr)
        exit(4)
    }

    let targetFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 16000, channels: 1, interleaved: true)!
    let converter = AVAudioConverter(from: format, to: targetFormat)

    input.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, _ in
        guard let converter = converter else { return }
        let ratio = 16000.0 / format.sampleRate
        let outFrames = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 64
        guard let outBuf = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: outFrames) else { return }
        var err: NSError?
        var provided = false
        converter.convert(to: outBuf, error: &err) { _, outStatus in
            if provided {
                outStatus.pointee = .noDataNow
                return nil
            }
            provided = true
            outStatus.pointee = .haveData
            return buffer
        }
        if err == nil && outBuf.frameLength > 0 {
            try? audioFile.write(from: outBuf)
        }
    }

    signal(SIGTERM) { _ in exit(0) }
    signal(SIGINT) { _ in exit(0) }

    do {
        try engine.start()
        fputs("OPERO_AUDIO_TAP_READY mode=\(mode)\n", stderr)
        RunLoop.main.run()
    } catch {
        fputs("AVAudioEngine start error: \(error)\n", stderr)
        exit(5)
    }
}

let args = CommandLine.arguments
if args.count >= 4 && args[1] == "record" {
    recordAudio(outputPath: args[2], mode: args[3])
} else if args.count >= 4 && args[1] == "transcribe" {
    transcribeWav(path: args[2], localeId: args[3])
} else {
    fputs("Usage: opero-audio-tap <record|transcribe> <wav_path> <mode|locale>\n", stderr)
    exit(1)
}
