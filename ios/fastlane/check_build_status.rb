#!/usr/bin/env ruby

require 'spaceship'

# Login to App Store Connect
puts "Logging in to App Store Connect..."
Spaceship::ConnectAPI.login(ENV["APPLE_ID"])
puts "✅ Authentication successful!"

# Get the app
app = Spaceship::ConnectAPI::App.find("com.dled.stringhomeworktutor")
puts "App: #{app.name} (#{app.bundle_id})"

# Get builds
puts "Checking builds..."
builds = Spaceship::ConnectAPI::Build.all(app_id: app.id, sort: "-version")

if builds.empty?
  puts "❌ No builds found for this app"
else
  puts "Found #{builds.length} build(s):"
  builds.first(5).each_with_index do |build, index|
    status = case build.processing_state
    when "PROCESSING"
      "🔄 Processing"
    when "VALID"
      "✅ Ready for TestFlight"
    when "INVALID"
      "❌ Invalid"
    when "FAILED"
      "❌ Failed"
    else
      "❓ #{build.processing_state}"
    end
    
    puts "#{index + 1}. Version #{build.version} (#{build.version}) - #{status}"
    puts "   Uploaded: #{build.uploaded_date}"
    
    if build.processing_state == "PROCESSING"
      puts "   ⏳ This build is still being processed by Apple..."
    elsif build.processing_state == "VALID"
      puts "   🎉 This build is ready for TestFlight!"
    end
  end
end
