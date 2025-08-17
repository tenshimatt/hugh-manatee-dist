//
// SubscriptionView.swift - Demo Subscription Interface
//
import SwiftUI

struct SubscriptionView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @State private var selectedProduct: SubscriptionManager.MockProduct?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                VStack(spacing: 15) {
                    Text("Choose Your Plan")
                        .font(.largeTitle)
                        .bold()
                    
                    Text("Get unlimited access to Knome's mental wellness support")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                }
                
                LazyVStack(spacing: 15) {
                    ForEach(subscriptionManager.products) { product in
                        SubscriptionCard(
                            product: product,
                            isSelected: selectedProduct?.id == product.id
                        ) {
                            selectedProduct = product
                        }
                    }
                }
                
                if let selectedProduct = selectedProduct {
                    Button {
                        Task {
                            let success = await subscriptionManager.purchase(selectedProduct)
                            if success {
                                dismiss()
                            }
                        }
                    } label: {
                        Text("Subscribe for \(selectedProduct.displayPrice)")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                
                Text("Free 7-day trial • Cancel anytime")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Subscription")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            Task {
                await subscriptionManager.loadProducts()
            }
        }
    }
}

struct SubscriptionCard: View {
    let product: SubscriptionManager.MockProduct
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text(tierName)
                        .font(.headline)
                        .bold()
                    
                    Text(tierDescription)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text(product.displayPrice)
                        .font(.title2)
                        .bold()
                        .foregroundColor(Color.blue)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color.blue)
                        .font(.title2)
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
    
    private var tierName: String {
        switch product.id {
        case "knome.starter.monthly": return "Starter"
        case "knome.standard.monthly": return "Standard"
        case "knome.power.monthly": return "Power"
        case "knome.unlimited.monthly": return "Unlimited"
        default: return "Plan"
        }
    }
    
    private var tierDescription: String {
        switch product.id {
        case "knome.starter.monthly": return "5 minutes daily"
        case "knome.standard.monthly": return "15 minutes daily"
        case "knome.power.monthly": return "30 minutes daily"
        case "knome.unlimited.monthly": return "Unlimited access"
        default: return ""
        }
    }
}
