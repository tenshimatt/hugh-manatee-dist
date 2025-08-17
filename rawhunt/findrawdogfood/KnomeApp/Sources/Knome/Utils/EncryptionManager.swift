//
// EncryptionManager.swift - Local Data Encryption
//
import Foundation
import CryptoKit

class EncryptionManager: ObservableObject {
    private let keychain = Keychain()
    private let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    
    func saveSessionSummary(_ summary: String) {
        let data = summary.data(using: .utf8)!
        let encryptedData = encrypt(data: data)
        
        let summaryURL = documentsPath.appendingPathComponent("session_summary.enc")
        try? encryptedData.write(to: summaryURL)
    }
    
    func loadSessionSummary() -> String? {
        let summaryURL = documentsPath.appendingPathComponent("session_summary.enc")
        
        guard let encryptedData = try? Data(contentsOf: summaryURL),
              let decryptedData = decrypt(data: encryptedData),
              let summary = String(data: decryptedData, encoding: .utf8) else {
            return nil
        }
        
        return summary
    }
    
    func saveJournalEntries(_ entries: [JournalEntry]) {
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(entries) else { return }
        
        let encryptedData = encrypt(data: data)
        let journalURL = documentsPath.appendingPathComponent("journal.enc")
        try? encryptedData.write(to: journalURL)
    }
    
    func loadJournalEntries() -> [JournalEntry] {
        let journalURL = documentsPath.appendingPathComponent("journal.enc")
        
        guard let encryptedData = try? Data(contentsOf: journalURL),
              let decryptedData = decrypt(data: encryptedData) else {
            return []
        }
        
        let decoder = JSONDecoder()
        return (try? decoder.decode([JournalEntry].self, from: decryptedData)) ?? []
    }
    
    func deleteAllData() {
        let fileURLs = [
            documentsPath.appendingPathComponent("session_summary.enc"),
            documentsPath.appendingPathComponent("journal.enc")
        ]
        
        for url in fileURLs {
            try? FileManager.default.removeItem(at: url)
        }
        
        keychain.deleteEncryptionKey()
    }
    
    private func encrypt(data: Data) -> Data {
        let key = keychain.getOrCreateEncryptionKey()
        let sealedBox = try! AES.GCM.seal(data, using: key)
        return sealedBox.combined!
    }
    
    private func decrypt(data: Data) -> Data? {
        let key = keychain.getOrCreateEncryptionKey()
        guard let sealedBox = try? AES.GCM.SealedBox(combined: data),
              let decryptedData = try? AES.GCM.open(sealedBox, using: key) else {
            return nil
        }
        return decryptedData
    }
}
