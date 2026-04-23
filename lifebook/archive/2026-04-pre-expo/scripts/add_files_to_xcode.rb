#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'MemoirGuide.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Find the groups
models_group = project.main_group.groups.find { |g| g.name == 'Models' }
views_group = project.main_group.groups.find { |g| g.name == 'Views' }

# Add ThemeManager.swift to Models group
theme_manager_file = models_group.new_file('Models/ThemeManager.swift')
target.add_file_references([theme_manager_file])

# Add ThemeSwitcherButton.swift to Views group
theme_switcher_file = views_group.new_file('Views/ThemeSwitcherButton.swift')
target.add_file_references([theme_switcher_file])

# Save the project
project.save

puts "Files added to Xcode project successfully!"
