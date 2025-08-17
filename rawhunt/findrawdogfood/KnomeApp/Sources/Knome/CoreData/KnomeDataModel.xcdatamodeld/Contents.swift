//
// KnomeDataModel Core Data Model Contents
// This file represents the Core Data model structure
//
import Foundation
import CoreData

// This is a placeholder for the Core Data model
// In a real Xcode project, this would be a .xcdatamodeld bundle
// For now, we'll use a simplified approach with NSManagedObject subclasses

extension NSManagedObjectModel {
    static var knomeDataModel: NSManagedObjectModel {
        let model = NSManagedObjectModel()
        
        // Create entities programmatically
        let chatMessageEntity = NSEntityDescription()
        chatMessageEntity.name = "ChatMessageEntity"
        chatMessageEntity.managedObjectClassName = "ChatMessageEntity"
        
        let idAttribute = NSAttributeDescription()
        idAttribute.name = "id"
        idAttribute.attributeType = .UUIDAttributeType
        idAttribute.isOptional = false
        
        let contentAttribute = NSAttributeDescription()
        contentAttribute.name = "content"
        contentAttribute.attributeType = .stringAttributeType
        contentAttribute.isOptional = false
        
        let isUserAttribute = NSAttributeDescription()
        isUserAttribute.name = "isUser"
        isUserAttribute.attributeType = .booleanAttributeType
        isUserAttribute.defaultValue = false
        
        let timestampAttribute = NSAttributeDescription()
        timestampAttribute.name = "timestamp"
        timestampAttribute.attributeType = .dateAttributeType
        timestampAttribute.isOptional = false
        
        chatMessageEntity.properties = [idAttribute, contentAttribute, isUserAttribute, timestampAttribute]
        
        model.entities = [chatMessageEntity]
        
        return model
    }
}