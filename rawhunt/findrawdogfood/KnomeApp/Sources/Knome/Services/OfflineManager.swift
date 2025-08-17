//
// OfflineManager.swift - Offline Capabilities and Message Queuing
//
import Foundation
import Network

// MARK: - Queued Message
struct QueuedMessage: Codable, Identifiable {
    let id: UUID
    let message: ChatMessage
    let timestamp: Date
    let retryCount: Int
    
    init(message: ChatMessage, retryCount: Int = 0) {
        self.id = UUID()
        self.message = message
        self.timestamp = Date()
        self.retryCount = retryCount
    }
}

// MARK: - Network Monitor
@MainActor
class NetworkMonitor: ObservableObject {
    @Published var isConnected = false
    @Published var connectionType: ConnectionType = .unknown
    @Published var isExpensive = false
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    enum ConnectionType {
        case wifi
        case cellular
        case ethernet
        case unknown
    }
    
    init() {
        startMonitoring()
    }
    
    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isConnected = path.status == .satisfied
                self?.isExpensive = path.isExpensive
                
                if path.usesInterfaceType(.wifi) {
                    self?.connectionType = .wifi
                } else if path.usesInterfaceType(.cellular) {
                    self?.connectionType = .cellular
                } else if path.usesInterfaceType(.wiredEthernet) {
                    self?.connectionType = .ethernet
                } else {
                    self?.connectionType = .unknown
                }
            }
        }
        
        monitor.start(queue: queue)
    }
    
    deinit {
        monitor.cancel()
    }
}

// MARK: - Offline Manager
@MainActor
class OfflineManager: ObservableObject {
    @Published var isOffline = false
    @Published var queuedMessages: [QueuedMessage] = []
    @Published var syncStatus: SyncStatus = .idle
    
    private let localStorage: LocalStorageManager
    private let networkMonitor: NetworkMonitor
    private var syncTask: Task<Void, Never>?
    
    enum SyncStatus {
        case idle
        case syncing
        case failed(Error)
        case completed
        
        var description: String {
            switch self {
            case .idle:
                return "Ready"
            case .syncing:
                return "Syncing..."
            case .failed(let error):
                return "Sync failed: \(error.localizedDescription)"
            case .completed:
                return "Synced"
            }
        }
    }
    
    init() {
        self.localStorage = LocalStorageManager()
        self.networkMonitor = NetworkMonitor()
        
        loadQueuedMessages()
        observeNetworkChanges()
    }
    
    // MARK: - Message Queuing
    func queueMessage(_ message: ChatMessage) {
        let queued = QueuedMessage(message: message)
        queuedMessages.append(queued)
        saveQueuedMessages()
        
        // Try to process immediately if online
        if networkMonitor.isConnected {
            Task {
                await processQueuedMessages()
            }
        }
    }
    
    func removeFromQueue(_ messageId: UUID) {
        queuedMessages.removeAll { $0.id == messageId }
        saveQueuedMessages()
    }
    
    // MARK: - Sync Operations
    func processQueuedMessages() async {
        guard networkMonitor.isConnected,
              !queuedMessages.isEmpty,
              syncStatus != .syncing else { return }
        
        syncStatus = .syncing
        
        var successfullyProcessed: [UUID] = []
        var failedMessages: [QueuedMessage] = []
        
        for queued in queuedMessages {
            do {
                // Process message (this would call your ChatManager)
                // For now, we'll simulate processing
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5 second delay
                
                successfullyProcessed.append(queued.id)
                print("✅ Processed queued message: \(queued.message.content)")
            } catch {
                print("❌ Failed to process message: \(error)")
                
                // Increment retry count
                var updatedMessage = queued
                updatedMessage = QueuedMessage(
                    message: queued.message,
                    retryCount: queued.retryCount + 1
                )
                
                // Only retry if under max attempts
                if updatedMessage.retryCount < 3 {
                    failedMessages.append(updatedMessage)
                }
            }
        }
        
        // Update queue
        queuedMessages = failedMessages
        saveQueuedMessages()
        
        if failedMessages.isEmpty {
            syncStatus = .completed
        } else {
            syncStatus = .failed(NSError(domain: "OfflineManager", 
                                        code: -1, 
                                        userInfo: [NSLocalizedDescriptionKey: "\(failedMessages.count) messages failed to sync"]))
        }
    }
    
    func retrySync() {
        syncTask?.cancel()
        syncTask = Task {
            await processQueuedMessages()
        }
    }
    
    // MARK: - Persistence
    private func loadQueuedMessages() {
        queuedMessages = localStorage.loadQueuedMessages()
    }
    
    private func saveQueuedMessages() {
        localStorage.saveQueuedMessages(queuedMessages)
    }
    
    // MARK: - Network Observation
    private func observeNetworkChanges() {
        Task {
            for await _ in networkMonitor.$isConnected.values {
                if networkMonitor.isConnected {
                    isOffline = false
                    // Auto-sync when connection is restored
                    await processQueuedMessages()
                } else {
                    isOffline = true
                }
            }
        }
    }
}

// MARK: - Local Storage Manager
class LocalStorageManager {
    private let documentsDirectory: URL
    private let queuedMessagesFile = "queued_messages.json"
    private let conversationHistoryFile = "conversation_history.json"
    private let userPreferencesFile = "user_preferences.json"
    
    init() {
        documentsDirectory = FileManager.default.urls(for: .documentDirectory, 
                                                      in: .userDomainMask).first!
    }
    
    // MARK: - Queued Messages
    func saveQueuedMessages(_ messages: [QueuedMessage]) {
        let url = documentsDirectory.appendingPathComponent(queuedMessagesFile)
        
        do {
            let data = try JSONEncoder().encode(messages)
            try data.write(to: url)
        } catch {
            print("Failed to save queued messages: \(error)")
        }
    }
    
    func loadQueuedMessages() -> [QueuedMessage] {
        let url = documentsDirectory.appendingPathComponent(queuedMessagesFile)
        
        guard FileManager.default.fileExists(atPath: url.path) else {
            return []
        }
        
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([QueuedMessage].self, from: data)
        } catch {
            print("Failed to load queued messages: \(error)")
            return []
        }
    }
    
    // MARK: - Conversation History
    func saveConversationHistory(_ messages: [ChatMessage]) {
        let url = documentsDirectory.appendingPathComponent(conversationHistoryFile)
        
        do {
            let data = try JSONEncoder().encode(messages)
            try data.write(to: url)
        } catch {
            print("Failed to save conversation history: \(error)")
        }
    }
    
    func loadConversationHistory() -> [ChatMessage] {
        let url = documentsDirectory.appendingPathComponent(conversationHistoryFile)
        
        guard FileManager.default.fileExists(atPath: url.path) else {
            return []
        }
        
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([ChatMessage].self, from: data)
        } catch {
            print("Failed to load conversation history: \(error)")
            return []
        }
    }
    
    // MARK: - User Preferences
    func saveUserPreferences(_ preferences: UserPreferences) {
        let url = documentsDirectory.appendingPathComponent(userPreferencesFile)
        
        do {
            let data = try JSONEncoder().encode(preferences)
            try data.write(to: url)
        } catch {
            print("Failed to save user preferences: \(error)")
        }
    }
    
    func loadUserPreferences() -> UserPreferences? {
        let url = documentsDirectory.appendingPathComponent(userPreferencesFile)
        
        guard FileManager.default.fileExists(atPath: url.path) else {
            return nil
        }
        
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode(UserPreferences.self, from: data)
        } catch {
            print("Failed to load user preferences: \(error)")
            return nil
        }
    }
    
    // MARK: - Clear Data
    func clearAllData() {
        let files = [queuedMessagesFile, conversationHistoryFile, userPreferencesFile]
        
        for file in files {
            let url = documentsDirectory.appendingPathComponent(file)
            try? FileManager.default.removeItem(at: url)
        }
    }
}