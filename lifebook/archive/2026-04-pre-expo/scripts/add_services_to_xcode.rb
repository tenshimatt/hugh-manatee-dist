#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'MemoirGuide.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Get the main group
main_group = project.main_group['MemoirGuide']

# Create Services group if it doesn't exist
services_group = main_group['Services'] || main_group.new_group('Services', 'Services')

# Files to add (relative to MemoirGuide group)
service_files = [
  'Services/HughVoiceService.swift',
  'Services/ContinuousRecordingService.swift',
  'Services/SilenceDetectionService.swift',
  'Services/ConversationManagerService.swift'
]

# Remove existing references first
services_group.files.each(&:remove_from_project)
services_group.groups.each(&:remove_from_project)

# Recreate Services group
services_group = main_group.new_group('Services', 'Services')

# Add each file to the project
service_files.each do |file_path|
  file_name = File.basename(file_path)

  # Add file reference with correct path
  file_ref = services_group.new_file(file_name)
  file_ref.set_source_tree('<group>')

  # Add to build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added #{file_name} to project"
end

# Save the project
project.save

puts "Project updated successfully!"
