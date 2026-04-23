// StoryVersion.swift
// Model for undo/redo functionality in story editing

import Foundation

struct StoryVersion: Codable, Identifiable {
    let id: UUID
    let text: String
    let timestamp: Date
    let wordCount: Int

    init(text: String) {
        self.id = UUID()
        self.text = text
        self.timestamp = Date()
        self.wordCount = text.split(separator: " ").count
    }

    init(id: UUID, text: String, timestamp: Date, wordCount: Int) {
        self.id = id
        self.text = text
        self.timestamp = timestamp
        self.wordCount = wordCount
    }
}

// MARK: - Version History Manager

class StoryVersionHistory: ObservableObject {
    @Published var currentVersion: StoryVersion
    @Published var canUndo: Bool = false
    @Published var canRedo: Bool = false

    private var undoStack: [StoryVersion] = []
    private var redoStack: [StoryVersion] = []

    init(initialText: String) {
        self.currentVersion = StoryVersion(text: initialText)
        updateCanUndoRedo()
    }

    func addVersion(_ text: String) {
        // Push current to undo stack
        undoStack.append(currentVersion)

        // Clear redo stack (new change invalidates redo history)
        redoStack.removeAll()

        // Set new current
        currentVersion = StoryVersion(text: text)

        updateCanUndoRedo()
    }

    func undo() {
        guard !undoStack.isEmpty else { return }

        // Push current to redo stack
        redoStack.append(currentVersion)

        // Pop from undo stack
        currentVersion = undoStack.removeLast()

        updateCanUndoRedo()
    }

    func redo() {
        guard !redoStack.isEmpty else { return }

        // Push current to undo stack
        undoStack.append(currentVersion)

        // Pop from redo stack
        currentVersion = redoStack.removeLast()

        updateCanUndoRedo()
    }

    func toData() -> Data? {
        let allVersions = undoStack + [currentVersion] + redoStack
        return try? JSONEncoder().encode(allVersions)
    }

    static func fromData(_ data: Data, currentIndex: Int) -> StoryVersionHistory? {
        guard let versions = try? JSONDecoder().decode([StoryVersion].self, from: data),
              currentIndex < versions.count else {
            return nil
        }

        let history = StoryVersionHistory(initialText: versions[currentIndex].text)
        history.undoStack = Array(versions[0..<currentIndex])
        history.currentVersion = versions[currentIndex]
        history.redoStack = Array(versions[(currentIndex + 1)...])
        history.updateCanUndoRedo()

        return history
    }

    private func updateCanUndoRedo() {
        canUndo = !undoStack.isEmpty
        canRedo = !redoStack.isEmpty
    }
}