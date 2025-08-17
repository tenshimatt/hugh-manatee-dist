//
// StoreKitManager.swift - StoreKit 2 Integration for Subscriptions
//
import Foundation
import StoreKit
import SwiftUI

// MARK: - Product Identifiers
enum ProductIdentifier: String, CaseIterable {
    case basicMonthly = "com.knome.basic.monthly"
    case proMonthly = "com.knome.pro.monthly"
    case premiumMonthly = "com.knome.premium.monthly"
    case basicYearly = "com.knome.basic.yearly"
    case proYearly = "com.knome.pro.yearly"
    case premiumYearly = "com.knome.premium.yearly"
    
    var subscriptionTier: SubscriptionTier {
        switch self {
        case .basicMonthly, .basicYearly:
            return .basic
        case .proMonthly, .proYearly:
            return .pro
        case .premiumMonthly, .premiumYearly:
            return .premium
        }
    }
    
    var isYearly: Bool {
        switch self {
        case .basicYearly, .proYearly, .premiumYearly:
            return true
        default:
            return false
        }
    }
}

// MARK: - Purchase State
enum PurchaseState {
    case notPurchased
    case pending
    case purchased
    case failed(Error)
    case cancelled
    case deferred
}

// MARK: - Subscription Status
struct SubscriptionStatus {
    let isActive: Bool
    let tier: SubscriptionTier
    let expirationDate: Date?
    let renewalDate: Date?
    let isInGracePeriod: Bool
    let isInBillingRetryPeriod: Bool
    let autoRenewal: Bool
}

// MARK: - Transaction Info
struct TransactionInfo {
    let id: UInt64
    let productID: String
    let purchaseDate: Date
    let expirationDate: Date?
    let isUpgraded: Bool
    let revocationDate: Date?
    let revocationReason: Transaction.RevocationReason?
}

// MARK: - StoreKit Manager
@MainActor
class StoreKitManager: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedProducts: Set<String> = []
    @Published var subscriptionStatus: SubscriptionStatus?
    @Published var isLoading = false
    @Published var error: String?
    
    private var purchaseStates: [String: PurchaseState] = [:]
    private var transactionListener: Task<Void, Error>?
    
    init() {
        transactionListener = listenForTransactions()
        
        Task {
            await loadProducts()
            await updateSubscriptionStatus()
        }
    }
    
    deinit {
        transactionListener?.cancel()
    }
    
    // MARK: - Product Loading
    func loadProducts() async {
        isLoading = true
        error = nil
        
        do {
            let productIdentifiers = ProductIdentifier.allCases.map { $0.rawValue }
            let storeProducts = try await Product.products(for: productIdentifiers)
            
            await MainActor.run {
                self.products = storeProducts.sorted { product1, product2 in
                    // Sort by tier first, then by duration
                    let tier1 = ProductIdentifier(rawValue: product1.id)?.subscriptionTier ?? .free
                    let tier2 = ProductIdentifier(rawValue: product2.id)?.subscriptionTier ?? .free
                    
                    if tier1 != tier2 {
                        return tier1.rawValue < tier2.rawValue
                    }
                    
                    let isYearly1 = ProductIdentifier(rawValue: product1.id)?.isYearly ?? false
                    let isYearly2 = ProductIdentifier(rawValue: product2.id)?.isYearly ?? false
                    
                    return !isYearly1 && isYearly2
                }
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = "Failed to load products: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    // MARK: - Purchase Management
    func purchase(_ product: Product) async -> PurchaseState {
        guard !isLoading else { return .failed(StoreError.operationInProgress) }
        
        isLoading = true
        purchaseStates[product.id] = .pending
        error = nil
        
        do {
            let result = try await product.purchase()
            
            let state = await handlePurchaseResult(result)
            purchaseStates[product.id] = state
            
            if case .purchased = state {
                await updateSubscriptionStatus()
                await handleSuccessfulPurchase(product)
            }
            
            isLoading = false
            return state
            
        } catch {
            let failureState = PurchaseState.failed(error)
            purchaseStates[product.id] = failureState
            
            await MainActor.run {
                self.error = "Purchase failed: \(error.localizedDescription)"
                self.isLoading = false
            }
            
            return failureState
        }
    }
    
    private func handlePurchaseResult(_ result: Product.PurchaseResult) async -> PurchaseState {
        switch result {
        case .success(let verification):
            let transaction = try? verification.payloadValue
            await transaction?.finish()
            return .purchased
            
        case .userCancelled:
            return .cancelled
            
        case .pending:
            return .pending
            
        @unknown default:
            return .failed(StoreError.unknown)
        }
    }
    
    private func handleSuccessfulPurchase(_ product: Product) async {
        // Add to purchased products
        purchasedProducts.insert(product.id)
        
        // Update app state
        if let productId = ProductIdentifier(rawValue: product.id) {
            let tier = productId.subscriptionTier
            NotificationCenter.default.post(
                name: .subscriptionPurchased,
                object: tier
            )
        }
        
        // Track analytics
        await trackPurchaseEvent(product)
    }
    
    // MARK: - Subscription Status
    func updateSubscriptionStatus() async {
        var currentStatus: SubscriptionStatus?
        
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            
            if let product = products.first(where: { $0.id == transaction.productID }),
               let productId = ProductIdentifier(rawValue: product.id) {
                
                let tier = productId.subscriptionTier
                let expirationDate = transaction.expirationDate
                let isActive = expirationDate?.timeIntervalSinceNow ?? 0 > 0
                
                // Get subscription info for more details
                if let subscriptionInfo = transaction.subscriptionStatus {
                    currentStatus = SubscriptionStatus(
                        isActive: isActive && subscriptionInfo.state == .subscribed,
                        tier: tier,
                        expirationDate: expirationDate,
                        renewalDate: subscriptionInfo.renewalInfo.renewalDate,
                        isInGracePeriod: subscriptionInfo.state == .inGracePeriod,
                        isInBillingRetryPeriod: subscriptionInfo.state == .inBillingRetryPeriod,
                        autoRenewal: subscriptionInfo.renewalInfo.willAutoRenew
                    )
                } else {
                    currentStatus = SubscriptionStatus(
                        isActive: isActive,
                        tier: tier,
                        expirationDate: expirationDate,
                        renewalDate: nil,
                        isInGracePeriod: false,
                        isInBillingRetryPeriod: false,
                        autoRenewal: true
                    )
                }
                
                break
            }
        }
        
        await MainActor.run {
            self.subscriptionStatus = currentStatus ?? SubscriptionStatus(
                isActive: false,
                tier: .free,
                expirationDate: nil,
                renewalDate: nil,
                isInGracePeriod: false,
                isInBillingRetryPeriod: false,
                autoRenewal: false
            )
        }
    }
    
    // MARK: - Restore Purchases
    func restorePurchases() async {
        isLoading = true
        error = nil
        
        do {
            try await AppStore.sync()
            await updateSubscriptionStatus()
            
            await MainActor.run {
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = "Failed to restore purchases: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    // MARK: - Transaction Listening
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                
                await self.handleTransactionUpdate(transaction)
            }
        }
    }
    
    private func handleTransactionUpdate(_ transaction: Transaction) async {
        // Update purchased products
        if transaction.revocationDate == nil {
            purchasedProducts.insert(transaction.productID)
        } else {
            purchasedProducts.remove(transaction.productID)
        }
        
        // Update subscription status
        await updateSubscriptionStatus()
        
        // Finish the transaction
        await transaction.finish()
    }
    
    // MARK: - Analytics
    private func trackPurchaseEvent(_ product: Product) async {
        // Implement analytics tracking here
        print("📈 Purchase tracked: \(product.id) - \(product.displayPrice)")
    }
    
    // MARK: - Helpers
    func product(for identifier: ProductIdentifier) -> Product? {
        return products.first { $0.id == identifier.rawValue }
    }
    
    func isPurchased(_ product: Product) -> Bool {
        return purchasedProducts.contains(product.id)
    }
    
    func purchaseState(for product: Product) -> PurchaseState {
        return purchaseStates[product.id] ?? .notPurchased
    }
    
    func monthlyProduct(for tier: SubscriptionTier) -> Product? {
        let identifier: ProductIdentifier
        switch tier {
        case .basic:
            identifier = .basicMonthly
        case .pro:
            identifier = .proMonthly
        case .premium:
            identifier = .premiumMonthly
        default:
            return nil
        }
        return product(for: identifier)
    }
    
    func yearlyProduct(for tier: SubscriptionTier) -> Product? {
        let identifier: ProductIdentifier
        switch tier {
        case .basic:
            identifier = .basicYearly
        case .pro:
            identifier = .proYearly
        case .premium:
            identifier = .premiumYearly
        default:
            return nil
        }
        return product(for: identifier)
    }
}

// MARK: - Store Errors
enum StoreError: Error, LocalizedError {
    case operationInProgress
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .operationInProgress:
            return "Another operation is already in progress"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - Subscription View
struct SubscriptionView: View {
    @StateObject private var storeManager = StoreKitManager()
    @EnvironmentObject private var appState: AppState
    @State private var selectedTier: SubscriptionTier = .pro
    @State private var isYearly = false
    @State private var showingPurchaseAlert = false
    @State private var purchaseMessage = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 16) {
                        Image("GnomeImages")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 80, height: 80)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        Text("Unlock Premium Features")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Get unlimited access to Knome's full suite of mental wellness tools")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top)
                    
                    // Billing Toggle
                    HStack {
                        Text("Monthly")
                        Toggle("", isOn: $isYearly)
                            .labelsHidden()
                        Text("Yearly")
                        Text("Save 20%")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.green.opacity(0.2))
                            .foregroundColor(.green)
                            .clipShape(Capsule())
                    }
                    .font(.subheadline)
                    
                    // Product Cards
                    LazyVStack(spacing: 16) {
                        ForEach(SubscriptionTier.allCases.filter { $0 != .free }, id: \.self) { tier in
                            SubscriptionCard(
                                tier: tier,
                                isYearly: isYearly,
                                isSelected: selectedTier == tier,
                                product: isYearly ? storeManager.yearlyProduct(for: tier) : storeManager.monthlyProduct(for: tier),
                                onSelect: { selectedTier = tier }
                            )
                        }
                    }
                    
                    // Purchase Button
                    VStack(spacing: 12) {
                        Button {
                            purchaseSelectedPlan()
                        } label: {
                            Text("Start \(selectedTier.rawValue.capitalized) Plan")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(storeManager.isLoading)
                        
                        Button("Restore Purchases") {
                            Task {
                                await storeManager.restorePurchases()
                            }
                        }
                        .font(.subheadline)
                        
                        Text("Cancel anytime in App Store settings")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    // Features List
                    VStack(alignment: .leading, spacing: 12) {
                        Text("All Plans Include:")
                            .font(.headline)
                            .padding(.top)
                        
                        FeatureRow(text: "Unlimited conversations with Knome")
                        FeatureRow(text: "Voice input and output")
                        FeatureRow(text: "Private journal with encryption")
                        FeatureRow(text: "Personalized recommendations")
                        FeatureRow(text: "Progress tracking and analytics")
                        FeatureRow(text: "Export your data anytime")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Spacer(minLength: 50)
                }
                .padding()
            }
            .navigationTitle("Subscription")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Purchase Status", isPresented: $showingPurchaseAlert) {
                Button("OK") { }
            } message: {
                Text(purchaseMessage)
            }
            .overlay {
                if storeManager.isLoading {
                    Color.black.opacity(0.3)
                        .overlay {
                            ProgressView("Processing...")
                                .padding()
                                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
                        }
                        .ignoresSafeArea()
                }
            }
        }
        .task {
            await storeManager.loadProducts()
        }
    }
    
    private func purchaseSelectedPlan() {
        let product = isYearly ? 
            storeManager.yearlyProduct(for: selectedTier) : 
            storeManager.monthlyProduct(for: selectedTier)
        
        guard let product = product else {
            purchaseMessage = "Product not available"
            showingPurchaseAlert = true
            return
        }
        
        Task {
            let result = await storeManager.purchase(product)
            
            await MainActor.run {
                switch result {
                case .purchased:
                    purchaseMessage = "Successfully subscribed to \(selectedTier.rawValue.capitalized)!"
                    appState.updateSubscription(isSubscribed: true, tier: selectedTier)
                case .cancelled:
                    purchaseMessage = "Purchase cancelled"
                case .pending:
                    purchaseMessage = "Purchase is pending approval"
                case .failed(let error):
                    purchaseMessage = "Purchase failed: \(error.localizedDescription)"
                default:
                    purchaseMessage = "Purchase completed"
                }
                showingPurchaseAlert = true
            }
        }
    }
}

struct SubscriptionCard: View {
    let tier: SubscriptionTier
    let isYearly: Bool
    let isSelected: Bool
    let product: Product?
    let onSelect: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(tier.rawValue.capitalized)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if let product = product {
                        Text(product.displayPrice)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(isYearly ? "per year" : "per month")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title2)
                }
            }
            
            Text("Up to \(tier.dailyMessageLimit == -1 ? "unlimited" : "\(tier.dailyMessageLimit)") messages per day")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.blue : Color(.systemGray4), lineWidth: isSelected ? 2 : 1)
        )
        .onTapGesture {
            onSelect()
        }
    }
}

struct FeatureRow: View {
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
            Text(text)
                .font(.subheadline)
            Spacer()
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let subscriptionPurchased = Notification.Name("subscriptionPurchased")
}