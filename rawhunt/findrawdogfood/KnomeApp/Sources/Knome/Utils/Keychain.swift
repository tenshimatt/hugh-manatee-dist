//
// Keychain.swift - Secure Key Storage
//
import Foundation
import Security
import CryptoKit

class Keychain {
    private let service = "com.knome.encryption"
    private let account = "encryption-key"
    
    func getOrCreateEncryptionKey() -> SymmetricKey {
        if let existingKey = getEncryptionKey() {
            return existingKey
        }
        
        let newKey = SymmetricKey(size: .bits256)
        saveEncryptionKey(newKey)
        return newKey
    }
    
    private func getEncryptionKey() -> SymmetricKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let keyData = result as? Data else {
            return nil
        }
        
        return SymmetricKey(data: keyData)
    }
    
    private func saveEncryptionKey(_ key: SymmetricKey) {
        let keyData = key.withUnsafeBytes { Data($0) }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: keyData
        ]
        
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func deleteEncryptionKey() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
