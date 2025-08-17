//
// SimpleCoreDataStack.swift - Simplified Core Data Implementation
//
import Foundation
import CoreData

class SimpleCoreDataStack: ObservableObject {
    static let shared = SimpleCoreDataStack()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "KnomeModel", managedObjectModel: knomeModel)
        
        container.loadPersistentStores { _, error in
            if let error = error {
                print("❌ Core Data error: \(error)")
                // For now, continue without Core Data
            } else {
                print("✅ Core Data loaded successfully")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
        return container
    }()
    
    private lazy var knomeModel: NSManagedObjectModel = {
        let model = NSManagedObjectModel()
        
        // Simple ChatMessage entity
        let chatEntity = NSEntityDescription()
        chatEntity.name = "ChatMessage"
        chatEntity.managedObjectClassName = NSStringFromClass(NSManagedObject.self)
        
        let idAttr = NSAttributeDescription()
        idAttr.name = "id"
        idAttr.attributeType = .UUIDAttributeType
        
        let contentAttr = NSAttributeDescription()
        contentAttr.name = "content"
        contentAttr.attributeType = .stringAttributeType
        
        let isUserAttr = NSAttributeDescription()
        isUserAttr.name = "isUser"
        isUserAttr.attributeType = .booleanAttributeType
        
        let timestampAttr = NSAttributeDescription()
        timestampAttr.name = "timestamp"
        timestampAttr.attributeType = .dateAttributeType
        
        chatEntity.properties = [idAttr, contentAttr, isUserAttr, timestampAttr]
        
        model.entities = [chatEntity]
        return model
    }()
    
    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    private init() {}
    
    func save() {
        let context = persistentContainer.viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("❌ Save error: \(error)")
            }
        }
    }
    
    // Simple save message method
    func saveChatMessage(_ message: ChatMessage) {
        let context = viewContext
        let entity = NSManagedObject(entity: knomeModel.entitiesByName["ChatMessage"]!, insertInto: context)
        
        entity.setValue(message.id, forKey: "id")
        entity.setValue(message.content, forKey: "content")
        entity.setValue(message.isUser, forKey: "isUser")
        entity.setValue(message.timestamp, forKey: "timestamp")
        
        save()
    }
}