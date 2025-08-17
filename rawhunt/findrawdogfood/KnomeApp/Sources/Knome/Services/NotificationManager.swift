//
// NotificationManager.swift - Push Notifications and Local Notifications
//
import Foundation
import UserNotifications
import SwiftUI

// MARK: - Notification Types
enum NotificationType: String, CaseIterable {
    case dailyCheckIn = "daily_checkin"
    case journalPrompt = "journal_prompt"
    case medicationReminder = "medication_reminder"
    case therapyReminder = "therapy_reminder"
    case achievement = "achievement"
    case weeklyReview = "weekly_review"
    
    var title: String {
        switch self {
        case .dailyCheckIn:
            return "Time for your daily check-in"
        case .journalPrompt:
            return "Ready to journal?"
        case .medicationReminder:
            return "Medication reminder"
        case .therapyReminder:
            return "Therapy session reminder"
        case .achievement:
            return "Achievement unlocked!"
        case .weeklyReview:
            return "Your weekly wellness review"
        }
    }
    
    var defaultBody: String {
        switch self {
        case .dailyCheckIn:
            return "Take a moment to check in with Knome"
        case .journalPrompt:
            return "Writing can help process your thoughts"
        case .medicationReminder:
            return "Time to take your medication"
        case .therapyReminder:
            return "Your therapy session is coming up"
        case .achievement:
            return "You've reached a new milestone!"
        case .weeklyReview:
            return "See your progress this week"
        }
    }
}

// MARK: - Notification Settings
struct NotificationSettings: Codable {
    var dailyCheckInEnabled: Bool = true
    var dailyCheckInTime: Date = Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: Date())!
    
    
    var journalPromptEnabled: Bool = true
    var journalPromptTime: Date = Calendar.current.date(bySettingHour: 20, minute: 0, second: 0, of: Date())!
    
    var medicationRemindersEnabled: Bool = false
    var medicationTimes: [Date] = []
    
    var weeklyReviewEnabled: Bool = true
    var weeklyReviewDay: Int = 1 // Sunday
    
    enum ReminderFrequency: String, Codable, CaseIterable {
        case daily = "daily"
        case twiceDaily = "twice_daily"
        case weekly = "weekly"
        
        var description: String {
            switch self {
            case .daily: return "Once a day"
            case .twiceDaily: return "Twice a day"
            case .weekly: return "Once a week"
            }
        }
    }
}

// MARK: - Notification Manager
@MainActor
class NotificationManager: NSObject, ObservableObject {
    @Published var hasPermission = false
    @Published var settings = NotificationSettings()
    @Published var pendingNotifications: [UNNotificationRequest] = []
    @Published var deliveredNotifications: [UNNotification] = []
    
    private let center = UNUserNotificationCenter.current()
    private let localStorage = LocalStorageManager()
    
    override init() {
        super.init()
        center.delegate = self
        loadSettings()
        checkPermissionStatus()
    }
    
    // MARK: - Permission Management
    func requestPermission() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            await MainActor.run {
                self.hasPermission = granted
            }
            
            if granted {
                await UIApplication.shared.registerForRemoteNotifications()
                scheduleDefaultNotifications()
            }
            
            return granted
        } catch {
            print("❌ Notification permission error: \(error)")
            return false
        }
    }
    
    private func checkPermissionStatus() {
        Task {
            let settings = await center.notificationSettings()
            await MainActor.run {
                self.hasPermission = settings.authorizationStatus == .authorized
            }
        }
    }
    
    // MARK: - Notification Scheduling
    func scheduleNotification(type: NotificationType, 
                             title: String? = nil,
                             body: String? = nil,
                             date: Date,
                             repeats: Bool = false) {
        let content = UNMutableNotificationContent()
        content.title = title ?? type.title
        content.body = body ?? type.defaultBody
        content.sound = .default
        content.badge = 1
        content.categoryIdentifier = type.rawValue
        
        // Add custom data
        content.userInfo = [
            "type": type.rawValue,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        // Create trigger
        let calendar = Calendar.current
        let components = calendar.dateComponents([.hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: repeats)
        
        // Create request
        let request = UNNotificationRequest(
            identifier: "\(type.rawValue)_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        // Schedule
        center.add(request) { error in
            if let error = error {
                print("❌ Failed to schedule notification: \(error)")
            } else {
                print("✅ Scheduled \(type.rawValue) notification")
            }
        }
    }
    
    func scheduleDailyCheckIn() {
        guard settings.dailyCheckInEnabled else { return }
        
        cancelNotifications(ofType: .dailyCheckIn)
        
        scheduleNotification(
            type: .dailyCheckIn,
            date: settings.dailyCheckInTime,
            repeats: true
        )
    }
    
    
    func scheduleJournalPrompt() {
        guard settings.journalPromptEnabled else { return }
        
        cancelNotifications(ofType: .journalPrompt)
        
        let prompts = [
            "What are you grateful for today?",
            "What challenged you today and how did you handle it?",
            "What's one thing that made you smile today?",
            "How did you take care of yourself today?",
            "What would you like to remember about today?"
        ]
        
        scheduleNotification(
            type: .journalPrompt,
            body: prompts.randomElement()!,
            date: settings.journalPromptTime,
            repeats: true
        )
    }
    
    func scheduleMedicationReminders() {
        guard settings.medicationRemindersEnabled else { return }
        
        cancelNotifications(ofType: .medicationReminder)
        
        for time in settings.medicationTimes {
            scheduleNotification(
                type: .medicationReminder,
                date: time,
                repeats: true
            )
        }
    }
    
    func scheduleWeeklyReview() {
        guard settings.weeklyReviewEnabled else { return }
        
        cancelNotifications(ofType: .weeklyReview)
        
        scheduleWeeklyNotification(
            type: .weeklyReview,
            weekday: settings.weeklyReviewDay,
            hour: 18,
            minute: 0
        )
    }
    
    private func scheduleWeeklyNotification(type: NotificationType, 
                                           weekday: Int,
                                           hour: Int = 9,
                                           minute: Int = 0) {
        let content = UNMutableNotificationContent()
        content.title = type.title
        content.body = type.defaultBody
        content.sound = .default
        content.categoryIdentifier = type.rawValue
        
        var dateComponents = DateComponents()
        dateComponents.weekday = weekday
        dateComponents.hour = hour
        dateComponents.minute = minute
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        
        let request = UNNotificationRequest(
            identifier: "\(type.rawValue)_weekly",
            content: content,
            trigger: trigger
        )
        
        center.add(request)
    }
    
    private func scheduleDefaultNotifications() {
        scheduleDailyCheckIn()
        scheduleJournalPrompt()
        scheduleWeeklyReview()
    }
    
    // MARK: - Notification Management
    func cancelNotifications(ofType type: NotificationType) {
        Task {
            let pending = await center.pendingNotificationRequests()
            let identifiersToRemove = pending
                .filter { $0.content.categoryIdentifier == type.rawValue }
                .map { $0.identifier }
            
            center.removePendingNotificationRequests(withIdentifiers: identifiersToRemove)
        }
    }
    
    func cancelAllNotifications() {
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }
    
    func updatePendingNotifications() {
        Task {
            let requests = await center.pendingNotificationRequests()
            await MainActor.run {
                self.pendingNotifications = requests
            }
        }
    }
    
    func updateDeliveredNotifications() {
        Task {
            let notifications = await center.deliveredNotifications()
            await MainActor.run {
                self.deliveredNotifications = notifications
            }
        }
    }
    
    // MARK: - Settings Management
    func updateSettings(_ newSettings: NotificationSettings) {
        settings = newSettings
        saveSettings()
        
        // Reschedule notifications based on new settings
        cancelAllNotifications()
        if hasPermission {
            scheduleDefaultNotifications()
        }
    }
    
    private func loadSettings() {
        if let data = UserDefaults.standard.data(forKey: "notificationSettings"),
           let decoded = try? JSONDecoder().decode(NotificationSettings.self, from: data) {
            settings = decoded
        }
    }
    
    private func saveSettings() {
        if let encoded = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(encoded, forKey: "notificationSettings")
        }
    }
    
    // MARK: - Achievement Notifications
    func sendAchievementNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = UNNotificationSound(named: UNNotificationSoundName("achievement.wav"))
        content.categoryIdentifier = NotificationType.achievement.rawValue
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        
        let request = UNNotificationRequest(
            identifier: "achievement_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        center.add(request)
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension NotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                               willPresent notification: UNNotification,
                               withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                               didReceive response: UNNotificationResponse,
                               withCompletionHandler completionHandler: @escaping () -> Void) {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        
        if let typeString = userInfo["type"] as? String,
           let type = NotificationType(rawValue: typeString) {
            handleNotificationTap(type: type)
        }
        
        completionHandler()
    }
    
    private func handleNotificationTap(type: NotificationType) {
        // Navigate to appropriate screen based on notification type
        switch type {
        case .dailyCheckIn:
            // Navigate to chat
            NotificationCenter.default.post(name: .navigateToChat, object: nil)
        case .journalPrompt:
            // Navigate to journal
            NotificationCenter.default.post(name: .navigateToJournal, object: nil)
        case .medicationReminder, .therapyReminder:
            // Navigate to reminders/settings
            NotificationCenter.default.post(name: .navigateToSettings, object: nil)
        case .achievement, .weeklyReview:
            // Navigate to progress/stats
            NotificationCenter.default.post(name: .navigateToProgress, object: nil)
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let navigateToChat = Notification.Name("navigateToChat")
    static let navigateToJournal = Notification.Name("navigateToJournal")
    static let navigateToSettings = Notification.Name("navigateToSettings")
    static let navigateToProgress = Notification.Name("navigateToProgress")
}