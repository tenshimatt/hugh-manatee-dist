//
// BiometricManager.swift - Biometric Authentication and Security
//
import Foundation
import LocalAuthentication
import SwiftUI

// MARK: - Biometric Types
enum BiometricType {
    case none
    case touchID
    case faceID
    case opticID
    
    var name: String {
        switch self {
        case .none:
            return "None"
        case .touchID:
            return "Touch ID"
        case .faceID:
            return "Face ID"
        case .opticID:
            return "Optic ID"
        }
    }
    
    var icon: String {
        switch self {
        case .none:
            return "lock.fill"
        case .touchID:
            return "touchid"
        case .faceID:
            return "faceid"
        case .opticID:
            return "opticid"
        }
    }
}

// MARK: - Authentication Errors
enum BiometricError: Error, LocalizedError {
    case unavailable
    case notEnrolled
    case lockout
    case cancelled
    case failed
    case passcodeNotSet
    case unknown(Error)
    
    var errorDescription: String? {
        switch self {
        case .unavailable:
            return "Biometric authentication is not available on this device"
        case .notEnrolled:
            return "No biometric authentication is enrolled"
        case .lockout:
            return "Biometric authentication is locked. Use passcode to unlock"
        case .cancelled:
            return "Authentication was cancelled"
        case .failed:
            return "Biometric authentication failed"
        case .passcodeNotSet:
            return "Device passcode is not set"
        case .unknown(let error):
            return error.localizedDescription
        }
    }
    
    var recoveryAction: String? {
        switch self {
        case .unavailable:
            return "Use app passcode instead"
        case .notEnrolled:
            return "Set up biometric authentication in Settings"
        case .lockout:
            return "Enter device passcode"
        case .cancelled:
            return "Try again"
        case .failed:
            return "Try again or use passcode"
        case .passcodeNotSet:
            return "Set up device passcode in Settings"
        case .unknown:
            return "Try again"
        }
    }
}

// MARK: - Authentication Settings
struct BiometricSettings: Codable {
    var isEnabled: Bool = false
    var requireForAppLaunch: Bool = false
    var requireForSensitiveData: Bool = true
    var requireForExport: Bool = true
    var fallbackToPasscode: Bool = true
    var sessionTimeout: TimeInterval = 300 // 5 minutes
}

// MARK: - Biometric Manager
@MainActor
class BiometricManager: ObservableObject {
    @Published var isAvailable = false
    @Published var biometricType: BiometricType = .none
    @Published var isAuthenticated = false
    @Published var settings = BiometricSettings()
    @Published var lastError: BiometricError?
    
    private let context = LAContext()
    private var sessionStartTime: Date?
    private let keychainManager = Keychain()
    
    init() {
        checkBiometricAvailability()
        loadSettings()
    }
    
    // MARK: - Availability Check
    func checkBiometricAvailability() {
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            isAvailable = false
            biometricType = .none
            return
        }
        
        isAvailable = true
        
        switch context.biometryType {
        case .none:
            biometricType = .none
        case .touchID:
            biometricType = .touchID
        case .faceID:
            biometricType = .faceID
        case .opticID:
            biometricType = .opticID
        @unknown default:
            biometricType = .none
        }
    }
    
    // MARK: - Authentication
    func authenticate(reason: String = "Authenticate to access your secure data") async -> Result<Bool, BiometricError> {
        guard isAvailable else {
            return .failure(.unavailable)
        }
        
        // Check if session is still valid
        if isSessionValid() {
            return .success(true)
        }
        
        let context = LAContext()
        context.localizedFallbackTitle = settings.fallbackToPasscode ? "Use Passcode" : ""
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success {
                isAuthenticated = true
                sessionStartTime = Date()
                lastError = nil
                return .success(true)
            } else {
                return .failure(.failed)
            }
        } catch {
            let biometricError = mapError(error)
            lastError = biometricError
            return .failure(biometricError)
        }
    }
    
    func authenticateWithFallback(reason: String = "Authenticate to access your secure data") async -> Result<Bool, BiometricError> {
        var authPolicy: LAPolicy = .deviceOwnerAuthenticationWithBiometrics
        
        // If biometrics not available, try device passcode
        if !isAvailable || !settings.fallbackToPasscode {
            authPolicy = .deviceOwnerAuthentication
        }
        
        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"
        
        do {
            let success = try await context.evaluatePolicy(authPolicy, localizedReason: reason)
            
            if success {
                isAuthenticated = true
                sessionStartTime = Date()
                lastError = nil
                return .success(true)
            } else {
                return .failure(.failed)
            }
        } catch {
            let biometricError = mapError(error)
            lastError = biometricError
            return .failure(biometricError)
        }
    }
    
    // MARK: - Session Management
    private func isSessionValid() -> Bool {
        guard let startTime = sessionStartTime else { return false }
        return Date().timeIntervalSince(startTime) < settings.sessionTimeout
    }
    
    func invalidateSession() {
        isAuthenticated = false
        sessionStartTime = nil
    }
    
    func extendSession() {
        if isAuthenticated {
            sessionStartTime = Date()
        }
    }
    
    // MARK: - Secure Data Access
    func authenticateForSensitiveOperation(operation: String) async -> Bool {
        guard settings.isEnabled && settings.requireForSensitiveData else {
            return true // No authentication required
        }
        
        let result = await authenticate(reason: "Authenticate to \(operation)")
        return result.isSuccess
    }
    
    func authenticateForDataExport() async -> Bool {
        guard settings.isEnabled && settings.requireForExport else {
            return true
        }
        
        let result = await authenticate(reason: "Authenticate to export your data")
        return result.isSuccess
    }
    
    func authenticateForAppLaunch() async -> Bool {
        guard settings.isEnabled && settings.requireForAppLaunch else {
            return true
        }
        
        let result = await authenticateWithFallback(reason: "Authenticate to access Knome")
        return result.isSuccess
    }
    
    // MARK: - Settings Management
    func updateSettings(_ newSettings: BiometricSettings) {
        settings = newSettings
        saveSettings()
        
        // Invalidate session if settings changed
        if !newSettings.isEnabled {
            invalidateSession()
        }
    }
    
    private func loadSettings() {
        if let data = UserDefaults.standard.data(forKey: "biometricSettings"),
           let decoded = try? JSONDecoder().decode(BiometricSettings.self, from: data) {
            settings = decoded
        }
    }
    
    private func saveSettings() {
        if let encoded = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(encoded, forKey: "biometricSettings")
        }
    }
    
    // MARK: - Error Mapping
    private func mapError(_ error: Error) -> BiometricError {
        guard let laError = error as? LAError else {
            return .unknown(error)
        }
        
        switch laError.code {
        case .biometryNotAvailable:
            return .unavailable
        case .biometryNotEnrolled:
            return .notEnrolled
        case .biometryLockout:
            return .lockout
        case .userCancel, .systemCancel, .appCancel:
            return .cancelled
        case .userFallback, .authenticationFailed:
            return .failed
        case .passcodeNotSet:
            return .passcodeNotSet
        default:
            return .unknown(error)
        }
    }
}

// MARK: - Result Extension
extension Result where Success == Bool, Failure == BiometricError {
    var isSuccess: Bool {
        if case .success(let value) = self {
            return value
        }
        return false
    }
}

// MARK: - Biometric Authentication View
struct BiometricAuthenticationView: View {
    @StateObject private var biometricManager = BiometricManager()
    @State private var isAuthenticating = false
    @State private var showError = false
    
    let onAuthenticated: () -> Void
    let onCancel: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            // Biometric Icon
            Image(systemName: biometricManager.biometricType.icon)
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            VStack(spacing: 16) {
                Text("Authenticate")
                    .font(.title)
                    .fontWeight(.medium)
                
                Text("Use \(biometricManager.biometricType.name) to access your secure data")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 16) {
                Button {
                    authenticate()
                } label: {
                    HStack {
                        if isAuthenticating {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: biometricManager.biometricType.icon)
                        }
                        Text(isAuthenticating ? "Authenticating..." : "Authenticate")
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isAuthenticating)
                
                if biometricManager.settings.fallbackToPasscode {
                    Button("Use Passcode") {
                        authenticateWithPasscode()
                    }
                    .buttonStyle(.bordered)
                }
                
                Button("Cancel") {
                    onCancel()
                }
                .buttonStyle(.borderless)
            }
        }
        .padding()
        .alert("Authentication Error", isPresented: $showError) {
            Button("OK") {
                showError = false
            }
            if let recoveryAction = biometricManager.lastError?.recoveryAction {
                Button(recoveryAction) {
                    if biometricManager.lastError?.recoveryAction == "Try again" {
                        authenticate()
                    }
                }
            }
        } message: {
            if let error = biometricManager.lastError {
                Text(error.localizedDescription)
            }
        }
        .onAppear {
            if biometricManager.settings.requireForAppLaunch {
                authenticate()
            }
        }
    }
    
    private func authenticate() {
        guard !isAuthenticating else { return }
        
        isAuthenticating = true
        
        Task {
            let result = await biometricManager.authenticate()
            
            await MainActor.run {
                isAuthenticating = false
                
                switch result {
                case .success:
                    onAuthenticated()
                case .failure(let error):
                    if error != .cancelled {
                        showError = true
                    }
                }
            }
        }
    }
    
    private func authenticateWithPasscode() {
        isAuthenticating = true
        
        Task {
            let result = await biometricManager.authenticateWithFallback()
            
            await MainActor.run {
                isAuthenticating = false
                
                switch result {
                case .success:
                    onAuthenticated()
                case .failure(let error):
                    if error != .cancelled {
                        showError = true
                    }
                }
            }
        }
    }
}

// MARK: - App Launch Authentication
struct AppLaunchAuthenticationWrapper<Content: View>: View {
    @StateObject private var biometricManager = BiometricManager()
    @State private var isAuthenticated = false
    @State private var showAuthentication = false
    
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        Group {
            if isAuthenticated || !biometricManager.settings.requireForAppLaunch {
                content
            } else {
                BiometricAuthenticationView(
                    onAuthenticated: {
                        isAuthenticated = true
                    },
                    onCancel: {
                        // Handle app exit or show alternative flow
                    }
                )
            }
        }
        .onAppear {
            checkAuthenticationRequirement()
        }
        .onChange(of: biometricManager.settings.requireForAppLaunch) { _ in
            checkAuthenticationRequirement()
        }
    }
    
    private func checkAuthenticationRequirement() {
        if biometricManager.settings.requireForAppLaunch && !biometricManager.isSessionValid() {
            isAuthenticated = false
        } else {
            isAuthenticated = true
        }
    }
}