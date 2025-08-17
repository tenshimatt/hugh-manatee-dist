//
// SubscriptionManager.swift - Demo Subscription Management
//
import Foundation

@MainActor
class SubscriptionManager: ObservableObject {
    @Published var products: [MockProduct] = []
    @Published var purchasedProductIDs: Set<String> = []
    
    // Mock product for demo mode
    struct MockProduct: Identifiable {
        let id: String
        let displayPrice: String
        let displayName: String
    }
    
    func loadProducts() async {
        // Always use mock products for now
        print("Loading mock subscription products")
        products = [
            MockProduct(id: "knome.starter.monthly", displayPrice: "$9.99", displayName: "Starter"),
            MockProduct(id: "knome.standard.monthly", displayPrice: "$19.99", displayName: "Standard"), 
            MockProduct(id: "knome.power.monthly", displayPrice: "$29.99", displayName: "Power"),
            MockProduct(id: "knome.unlimited.monthly", displayPrice: "$49.99", displayName: "Unlimited")
        ]
    }
    
    func purchase(_ product: MockProduct) async -> Bool {
        print("Mock purchase of \(product.displayName)")
        purchasedProductIDs.insert(product.id)
        return true
    }
    
    func restorePurchases() async {
        print("Mock restore purchases")
    }
    
    func checkSubscriptionStatus() async {
        print("Mock subscription status check")
        // In production, this would check real subscription status
        // For now, just maintain mock state
    }
}
