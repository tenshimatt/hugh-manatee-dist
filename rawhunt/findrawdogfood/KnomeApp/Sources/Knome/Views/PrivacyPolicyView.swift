//
// PrivacyPolicyView.swift - Privacy Policy Display
//
import SwiftUI

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Privacy Policy")
                    .font(.largeTitle)
                    .bold()
                
                Text("Last updated: \(Date().formatted(date: .abbreviated, time: .omitted))")
                    .foregroundColor(.secondary)
                
                privacySection(
                    title: "Data Collection",
                    content: "Knome collects only the information necessary to provide our mental wellness services. All conversations and journal entries are stored locally on your device."
                )
                
                privacySection(
                    title: "Data Storage",
                    content: "All data is encrypted and stored locally on your device. We do not store your conversations or personal information on our servers."
                )
                
                privacySection(
                    title: "Data Sharing",
                    content: "We do not share your personal data with third parties. Your conversations with Knome remain private and confidential."
                )
                
                privacySection(
                    title: "Your Rights",
                    content: "You have the right to export or delete all your data at any time. This can be done through the app settings."
                )
                
                privacySection(
                    title: "Contact",
                    content: "If you have questions about this Privacy Policy, please contact us at privacy@knome.app"
                )
            }
            .padding()
        }
        .navigationTitle("Privacy Policy")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func privacySection(title: String, content: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
                .bold()
            
            Text(content)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
