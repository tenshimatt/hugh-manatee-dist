//
//  AIEntityExtractorTests.swift
//  AuroraTests
//
//  Unit tests for AIEntityExtractor
//

import Testing
import Foundation
@testable import Aurora

/// Test suite for AIEntityExtractor functionality
struct AIEntityExtractorTests {

    // MARK: - JSON Parsing Tests

    @Test("Parse JSON response with all fields populated")
    func testParseCompleteJSON() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": "John Michael Smith",
            "dateOfBirth": "1950-03-15",
            "placeOfBirth": "Boston, Massachusetts"
          },
          "mother": {
            "fullName": "Margaret O'Brien Smith",
            "maidenName": "O'Brien",
            "birthplace": "Dublin, Ireland"
          },
          "father": {
            "fullName": "Robert James Wright",
            "birthplace": "London, England"
          },
          "spouse": {
            "name": "Sarah Ann Johnson",
            "whereMet": "At a dance in Boston"
          },
          "people": [
            {
              "name": "Thomas Smith",
              "relationship": "brother",
              "notes": "Older brother, served in Navy"
            }
          ],
          "places": [
            {
              "name": "Boston",
              "significance": "Hometown and birthplace",
              "yearOrPeriod": "1950-1970"
            }
          ],
          "events": [
            {
              "description": "Graduated from high school",
              "date": "1968-06-15",
              "place": "Boston Latin School"
            }
          ],
          "themes": ["childhood", "family history", "Irish heritage"],
          "suggestedCategory": "Family"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        // Verify user info
        #expect(entities.userInfo.fullName == "John Michael Smith")
        #expect(entities.userInfo.placeOfBirth == "Boston, Massachusetts")
        #expect(entities.userInfo.dateOfBirth != nil)

        // Verify mother info
        #expect(entities.mother.fullName == "Margaret O'Brien Smith")
        #expect(entities.mother.maidenName == "O'Brien")
        #expect(entities.mother.birthplace == "Dublin, Ireland")

        // Verify father info
        #expect(entities.father.fullName == "Robert James Wright")
        #expect(entities.father.birthplace == "London, England")

        // Verify spouse info
        #expect(entities.spouse.name == "Sarah Ann Johnson")
        #expect(entities.spouse.whereMet == "At a dance in Boston")

        // Verify people array
        #expect(entities.people.count == 1)
        #expect(entities.people[0].name == "Thomas Smith")
        #expect(entities.people[0].relationship == "brother")

        // Verify places array
        #expect(entities.places.count == 1)
        #expect(entities.places[0].name == "Boston")

        // Verify events array
        #expect(entities.events.count == 1)
        #expect(entities.events[0].description == "Graduated from high school")

        // Verify themes and category
        #expect(entities.themes.count == 3)
        #expect(entities.suggestedCategory == "Family")

        // Verify hasGenealogyInfo
        #expect(entities.hasGenealogyInfo == true)
    }

    @Test("Parse JSON response with null/missing fields")
    func testParsePartialJSON() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": "Jane Doe",
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "General"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        // Verify only fullName is set
        #expect(entities.userInfo.fullName == "Jane Doe")
        #expect(entities.userInfo.dateOfBirth == nil)
        #expect(entities.userInfo.placeOfBirth == nil)

        // Verify all mother fields are null
        #expect(entities.mother.fullName == nil)
        #expect(entities.mother.maidenName == nil)
        #expect(entities.mother.birthplace == nil)

        // Verify empty arrays
        #expect(entities.people.isEmpty)
        #expect(entities.places.isEmpty)
        #expect(entities.events.isEmpty)

        // hasGenealogyInfo should still be true due to fullName
        #expect(entities.hasGenealogyInfo == true)
    }

    @Test("Parse JSON with markdown code blocks")
    func testParseJSONWithMarkdown() async throws {
        let jsonResponse = """
        Here's the extracted information:

        ```json
        {
          "userInfo": {
            "fullName": "Test User",
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": "Test Mother",
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "General"
        }
        ```
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.userInfo.fullName == "Test User")
        #expect(entities.mother.fullName == "Test Mother")
    }

    @Test("Parse JSON with plain markdown code blocks (no json label)")
    func testParseJSONWithPlainMarkdown() async throws {
        let jsonResponse = """
        ```
        {
          "userInfo": {
            "fullName": "Another User",
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "General"
        }
        ```
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.userInfo.fullName == "Another User")
    }

    // MARK: - Date Parsing Tests

    @Test("Parse various date formats correctly")
    func testDateParsing() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": "1950-03-15",
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [
            {
              "description": "Wedding",
              "date": "1975-06-20",
              "place": null
            },
            {
              "description": "Move to California",
              "date": null,
              "place": "Los Angeles"
            }
          ],
          "themes": [],
          "suggestedCategory": "General"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        // Verify date of birth parsing
        #expect(entities.userInfo.dateOfBirth != nil)
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: entities.userInfo.dateOfBirth!)
        #expect(components.year == 1950)
        #expect(components.month == 3)
        #expect(components.day == 15)

        // Verify event date parsing
        #expect(entities.events.count == 2)
        #expect(entities.events[0].date != nil)
        #expect(entities.events[1].date == nil)
    }

    // MARK: - Helper Method Tests

    @Test("Suggest next question when full name is missing")
    func testSuggestNextQuestionFullName() async throws {
        let entities = ExtractedEntities(
            userInfo: .init(fullName: nil, dateOfBirth: nil, placeOfBirth: nil),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )

        let extractor = AIEntityExtractor.shared
        let suggestion = extractor.suggestNextQuestion(basedOn: entities, profile: nil)

        #expect(suggestion == "What's your full name?")
    }

    @Test("Suggest next question when date of birth is missing")
    func testSuggestNextQuestionDateOfBirth() async throws {
        let entities = ExtractedEntities(
            userInfo: .init(fullName: "John Smith", dateOfBirth: nil, placeOfBirth: nil),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )

        let extractor = AIEntityExtractor.shared
        let suggestion = extractor.suggestNextQuestion(basedOn: entities, profile: nil)

        #expect(suggestion == "When were you born?")
    }

    @Test("Suggest next question when mother's name is missing")
    func testSuggestNextQuestionMotherName() async throws {
        let entities = ExtractedEntities(
            userInfo: .init(fullName: "John Smith", dateOfBirth: Date(), placeOfBirth: "Boston"),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )

        let extractor = AIEntityExtractor.shared
        let suggestion = extractor.suggestNextQuestion(basedOn: entities, profile: nil)

        #expect(suggestion == "Tell me about your mother - what was her name?")
    }

    @Test("Suggest next question when father's name is missing")
    func testSuggestNextQuestionFatherName() async throws {
        let entities = ExtractedEntities(
            userInfo: .init(fullName: "John Smith", dateOfBirth: Date(), placeOfBirth: "Boston"),
            mother: .init(fullName: "Mary Smith", maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )

        let extractor = AIEntityExtractor.shared
        let suggestion = extractor.suggestNextQuestion(basedOn: entities, profile: nil)

        #expect(suggestion == "Tell me about your father - what was his name?")
    }

    @Test("Return nil when all critical fields are complete")
    func testSuggestNextQuestionComplete() async throws {
        let entities = ExtractedEntities(
            userInfo: .init(fullName: "John Smith", dateOfBirth: Date(), placeOfBirth: "Boston"),
            mother: .init(fullName: "Mary Smith", maidenName: "O'Brien", birthplace: nil),
            father: .init(fullName: "Robert Smith", birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )

        let extractor = AIEntityExtractor.shared
        let suggestion = extractor.suggestNextQuestion(basedOn: entities, profile: nil)

        #expect(suggestion == nil)
    }

    // MARK: - Entity Extraction Tests

    @Test("Extract mother's name correctly")
    func testExtractMotherName() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": "Margaret O'Brien",
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": ["family"],
          "suggestedCategory": "Family"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.mother.fullName == "Margaret O'Brien")
    }

    @Test("Extract birth date and location")
    func testExtractBirthInfo() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": "1950-03-15",
            "placeOfBirth": "Boston, Massachusetts"
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "Childhood"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.userInfo.dateOfBirth != nil)
        #expect(entities.userInfo.placeOfBirth == "Boston, Massachusetts")
    }

    @Test("Extract father's name and birthplace")
    func testExtractFatherInfo() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": "Robert Wright",
            "birthplace": "England"
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "Family"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.father.fullName == "Robert Wright")
        #expect(entities.father.birthplace == "England")
    }

    @Test("Extract spouse information")
    func testExtractSpouseInfo() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": "Sarah Johnson",
            "whereMet": "At a dance"
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": ["romance", "relationships"],
          "suggestedCategory": "Relationships"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.spouse.name == "Sarah Johnson")
        #expect(entities.spouse.whereMet == "At a dance")
    }

    @Test("Extract multiple entities from one transcription")
    func testExtractMultipleEntities() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": "John Smith",
            "dateOfBirth": "1950-03-15",
            "placeOfBirth": "Boston"
          },
          "mother": {
            "fullName": "Mary Smith",
            "maidenName": "O'Brien",
            "birthplace": "Ireland"
          },
          "father": {
            "fullName": "Robert Smith",
            "birthplace": "England"
          },
          "spouse": {
            "name": "Sarah Johnson",
            "whereMet": "At a dance"
          },
          "people": [
            {
              "name": "Tom Smith",
              "relationship": "brother",
              "notes": "Older brother"
            }
          ],
          "places": [
            {
              "name": "Boston",
              "significance": "Birthplace",
              "yearOrPeriod": "1950"
            }
          ],
          "events": [],
          "themes": ["family", "childhood"],
          "suggestedCategory": "Family"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.userInfo.fullName == "John Smith")
        #expect(entities.mother.fullName == "Mary Smith")
        #expect(entities.mother.maidenName == "O'Brien")
        #expect(entities.father.fullName == "Robert Smith")
        #expect(entities.spouse.name == "Sarah Johnson")
        #expect(entities.people.count == 1)
        #expect(entities.places.count == 1)
    }

    // MARK: - Edge Case Tests

    @Test("Handle empty transcription gracefully")
    func testEmptyTranscriptionHandling() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "General"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.hasGenealogyInfo == false)
        #expect(entities.people.isEmpty)
        #expect(entities.places.isEmpty)
        #expect(entities.events.isEmpty)
    }

    @Test("Handle special characters in names")
    func testSpecialCharactersInNames() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": "Seán O'Brien-MacDonald",
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": "María José García",
            "maidenName": "García-López",
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [],
          "themes": [],
          "suggestedCategory": "Family"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        #expect(entities.userInfo.fullName == "Seán O'Brien-MacDonald")
        #expect(entities.mother.fullName == "María José García")
        #expect(entities.mother.maidenName == "García-López")
    }

    @Test("Handle ambiguous or partial dates")
    func testAmbiguousDateHandling() async throws {
        let jsonResponse = """
        {
          "userInfo": {
            "fullName": null,
            "dateOfBirth": null,
            "placeOfBirth": null
          },
          "mother": {
            "fullName": null,
            "maidenName": null,
            "birthplace": null
          },
          "father": {
            "fullName": null,
            "birthplace": null
          },
          "spouse": {
            "name": null,
            "whereMet": null
          },
          "people": [],
          "places": [],
          "events": [
            {
              "description": "Moved to new city",
              "date": null,
              "place": "New York"
            }
          ],
          "themes": [],
          "suggestedCategory": "General"
        }
        """

        let extractor = AIEntityExtractor.shared
        let entities = try extractor.parseExtraction(response: jsonResponse)

        // When date is partial/ambiguous, it should be null
        #expect(entities.events[0].date == nil)
        #expect(entities.events[0].place == "New York")
    }

    @Test("Verify hasGenealogyInfo property logic")
    func testHasGenealogyInfoProperty() async throws {
        // Test with no genealogy info
        let emptyEntities = ExtractedEntities(
            userInfo: .init(fullName: nil, dateOfBirth: nil, placeOfBirth: nil),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )
        #expect(emptyEntities.hasGenealogyInfo == false)

        // Test with just user name
        let withName = ExtractedEntities(
            userInfo: .init(fullName: "John Smith", dateOfBirth: nil, placeOfBirth: nil),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )
        #expect(withName.hasGenealogyInfo == true)

        // Test with just date of birth
        let withDOB = ExtractedEntities(
            userInfo: .init(fullName: nil, dateOfBirth: Date(), placeOfBirth: nil),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: nil, whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )
        #expect(withDOB.hasGenealogyInfo == true)

        // Test with spouse info only
        let withSpouse = ExtractedEntities(
            userInfo: .init(fullName: nil, dateOfBirth: nil, placeOfBirth: nil),
            mother: .init(fullName: nil, maidenName: nil, birthplace: nil),
            father: .init(fullName: nil, birthplace: nil),
            spouse: .init(name: "Sarah Smith", whereMet: nil),
            people: [],
            places: [],
            events: [],
            themes: [],
            suggestedCategory: "General"
        )
        #expect(withSpouse.hasGenealogyInfo == true)
    }

    // MARK: - Prompt Building Tests

    @Test("Verify prompt building includes all required fields")
    func testPromptBuilding() async throws {
        let extractor = AIEntityExtractor.shared
        let prompt = extractor.buildExtractionPrompt(transcription: "Test transcription")

        // Verify prompt contains key sections
        #expect(prompt.contains("Extract genealogy"))
        #expect(prompt.contains("Names"))
        #expect(prompt.contains("Dates"))
        #expect(prompt.contains("Places"))
        #expect(prompt.contains("Relationships"))
        #expect(prompt.contains("Events"))
        #expect(prompt.contains("Test transcription"))
        #expect(prompt.contains("YYYY-MM-DD"))
        #expect(prompt.contains("userInfo"))
        #expect(prompt.contains("mother"))
        #expect(prompt.contains("father"))
        #expect(prompt.contains("spouse"))
    }
}
