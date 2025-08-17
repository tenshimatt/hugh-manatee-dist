//
// FAQView.swift - Frequently Asked Questions
//
import SwiftUI

struct FAQView: View {
    var body: some View {
        List {
            FAQItem(
                question: "Is this private?",
                answer: "Yes, absolutely. All conversations are stored locally on your device and encrypted. Nothing is shared with third parties without your explicit permission."
            )
            
            FAQItem(
                question: "Will I talk to a real person?",
                answer: "No, you're talking to Knome, an AI-powered digital therapist. Knome is designed to provide supportive conversations and mental wellness guidance."
            )
            
            FAQItem(
                question: "How much does it cost?",
                answer: "Crisis support is always free. For regular mental wellness support, plans start at $1/month for 5 minutes daily up to $100/month for unlimited access."
            )
            
            FAQItem(
                question: "Is this a replacement for therapy?",
                answer: "No, Knome is a supportive tool but not a replacement for professional mental health treatment. If you're experiencing severe mental health issues, please consult a licensed therapist."
            )
            
            FAQItem(
                question: "How do you track my usage?",
                answer: "Usage is tracked locally on your device based on conversation time. No usage data is sent to our servers."
            )
            
            FAQItem(
                question: "Can I delete my data?",
                answer: "Yes, you can delete all your data at any time from the More tab. This will permanently remove all conversations and journal entries from your device."
            )
        }
        .navigationTitle("FAQ")
        .navigationBarTitleDisplayMode(.large)
    }
}

struct FAQItem: View {
    let question: String
    let answer: String
    @State private var isExpanded = false
    
    var body: some View {
        DisclosureGroup(
            isExpanded: $isExpanded,
            content: {
                Text(answer)
                    .padding(.top, 5)
            },
            label: {
                Text(question)
                    .font(.headline)
            }
        )
    }
}
