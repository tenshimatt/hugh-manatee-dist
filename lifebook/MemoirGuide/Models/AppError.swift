// AppError.swift
// Error handling and user-facing error messages for Life Book

import Foundation

enum AppError: Error, LocalizedError, Identifiable {
    var id: String { localizedDescription }
    
    // Recording Errors
    case microphonePermissionDenied
    case speechRecognitionUnavailable
    case recordingFailed
    case transcriptionFailed
    case audioSessionSetupFailed
    case insufficientStorage
    
    // Core Data Errors
    case coreDataSaveFailed
    case coreDataLoadFailed
    case entityNotFound
    
    // CloudKit Errors
    case cloudKitUnavailable
    case cloudKitSyncFailed
    case cloudKitQuotaExceeded
    
    // AI Errors
    case aiServiceUnavailable
    case aiProcessingFailed
    case aiRateLimitExceeded
    
    // File System Errors
    case fileNotFound
    case fileAccessDenied
    case fileTooLarge
    
    // Network Errors
    case networkUnavailable
    case serverError
    case invalidResponse
    
    // User Input Errors
    case invalidInput
    case emptyContent
    
    var errorDescription: String? {
        switch self {
        // Recording Errors
        case .microphonePermissionDenied:
            return "Microphone access is required to record your stories. Please enable it in Settings."
        case .speechRecognitionUnavailable:
            return "Speech recognition is not available on this device."
        case .recordingFailed:
            return "Recording failed to start. Please try again."
        case .transcriptionFailed:
            return "Could not transcribe audio. Please try again."
        case .audioSessionSetupFailed:
            return "Could not setup audio recording. Please check your device settings."
        case .insufficientStorage:
            return "Not enough storage space to continue recording. Please free up space and try again."
            
        // Core Data Errors
        case .coreDataSaveFailed:
            return "Failed to save your story. Please try again."
        case .coreDataLoadFailed:
            return "Failed to load your stories. Please restart the app."
        case .entityNotFound:
            return "The requested story could not be found."
            
        // CloudKit Errors
        case .cloudKitUnavailable:
            return "iCloud is not available. Stories will be saved locally only."
        case .cloudKitSyncFailed:
            return "Failed to sync with iCloud. Changes will sync when connection improves."
        case .cloudKitQuotaExceeded:
            return "iCloud storage is full. Please free up space or upgrade your plan."
            
        // AI Errors
        case .aiServiceUnavailable:
            return "AI assistance is temporarily unavailable. Your recordings are still saved."
        case .aiProcessingFailed:
            return "AI processing failed. You can try again later."
        case .aiRateLimitExceeded:
            return "AI service is busy. Please wait a moment and try again."
            
        // File System Errors
        case .fileNotFound:
            return "The audio file could not be found."
        case .fileAccessDenied:
            return "Cannot access the file. Please check permissions."
        case .fileTooLarge:
            return "The file is too large to process."
            
        // Network Errors
        case .networkUnavailable:
            return "No internet connection. Some features may be limited."
        case .serverError:
            return "Server error occurred. Please try again later."
        case .invalidResponse:
            return "Received invalid response from server."
            
        // User Input Errors
        case .invalidInput:
            return "Please check your input and try again."
        case .emptyContent:
            return "Content cannot be empty."
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .microphonePermissionDenied:
            return "Go to Settings > Privacy & Security > Microphone and enable access for Life Book."
        case .speechRecognitionUnavailable:
            return "Speech recognition requires iOS 10+ and internet connection for best results."
        case .insufficientStorage:
            return "Delete unused apps or files to free up space."
        case .cloudKitUnavailable:
            return "Check that you're signed into iCloud in Settings."
        case .cloudKitQuotaExceeded:
            return "Manage your iCloud storage in Settings > [Your Name] > iCloud > Manage Storage."
        case .networkUnavailable:
            return "Connect to WiFi or cellular data to access all features."
        default:
            return nil
        }
    }
    
    var failureReason: String? {
        switch self {
        case .microphonePermissionDenied:
            return "The app needs microphone access to record your voice."
        case .speechRecognitionUnavailable:
            return "Device or system limitations prevent speech recognition."
        case .insufficientStorage:
            return "Audio files require significant storage space."
        case .cloudKitUnavailable, .cloudKitSyncFailed, .cloudKitQuotaExceeded:
            return "iCloud synchronization issues."
        case .networkUnavailable:
            return "Internet connection is required for some features."
        default:
            return "An unexpected error occurred."
        }
    }
}

// MARK: - Error Extensions for User-Friendly Messaging

extension AppError {
    var isRecoverable: Bool {
        switch self {
        case .microphonePermissionDenied, .speechRecognitionUnavailable, .insufficientStorage,
             .cloudKitUnavailable, .cloudKitQuotaExceeded, .networkUnavailable:
            return true
        default:
            return false
        }
    }
    
    var requiresUserAction: Bool {
        switch self {
        case .microphonePermissionDenied, .insufficientStorage, .cloudKitQuotaExceeded:
            return true
        default:
            return false
        }
    }
    
    var category: ErrorCategory {
        switch self {
        case .microphonePermissionDenied, .speechRecognitionUnavailable, .recordingFailed, 
             .transcriptionFailed, .audioSessionSetupFailed, .insufficientStorage:
            return .recording
        case .coreDataSaveFailed, .coreDataLoadFailed, .entityNotFound:
            return .storage
        case .cloudKitUnavailable, .cloudKitSyncFailed, .cloudKitQuotaExceeded:
            return .sync
        case .aiServiceUnavailable, .aiProcessingFailed, .aiRateLimitExceeded:
            return .ai
        case .fileNotFound, .fileAccessDenied, .fileTooLarge:
            return .file
        case .networkUnavailable, .serverError, .invalidResponse:
            return .network
        case .invalidInput, .emptyContent:
            return .userInput
        }
    }
    
    enum ErrorCategory {
        case recording, storage, sync, ai, file, network, userInput
        
        var icon: String {
            switch self {
            case .recording: return "mic.slash"
            case .storage: return "internaldrive"
            case .sync: return "icloud.slash"
            case .ai: return "brain"
            case .file: return "doc"
            case .network: return "wifi.slash"
            case .userInput: return "exclamationmark.triangle"
            }
        }
    }
}