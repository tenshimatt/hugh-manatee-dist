// MemoirGuideApp.swift
// Life Book - Memoir Recording App for Elderly Users
// Created for tenshimatt@mac.com

import SwiftUI
import CloudKit
import AVFoundation

@main
struct MemoirGuideApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var recordingManager = RecordingManager()
    @StateObject private var coreDataManager = CoreDataManager.shared
    @StateObject private var cloudKitManager = CloudKitManager()
    @StateObject private var aiInterviewer = AIInterviewer()
    @StateObject private var audioPlayer = AudioPlaybackManager.shared
    @StateObject private var themeManager = ThemeManager.shared
    @StateObject private var profileManager = ProfileChecklistManager.shared

    init() {
        setupAudioSession()
        requestPermissions()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, coreDataManager.context)
                .environment(\.appTheme, themeManager.currentTheme)
                .environmentObject(appState)
                .environmentObject(recordingManager)
                .environmentObject(coreDataManager)
                .environmentObject(cloudKitManager)
                .environmentObject(aiInterviewer)
                .environmentObject(audioPlayer)
                .environmentObject(themeManager)
                .environmentObject(profileManager)
                .preferredColorScheme(.light)
        }
    }
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothA2DP])
            try audioSession.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func requestPermissions() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            if !granted {
                print("Microphone permission denied")
            }
        }
    }
}
