require "jsonpath"
require "nokogiri"

# When /^I send a POST request (?:for|to) "([^"]*)"(?: with the following:)?$/ do |*args|
#   path = args.shift
#   body = JSON.parse(args.shift)
#   post path, body
# end

When(/^I send a POST request to "(.*?)" with the body:$/) do |path, body|
  puts "path :" + path
  puts "body :" + body
  # path = args.shift
  # body = JSON.parse(args.shift)
  # post path, body
end

When(/^I send the following test events:$/) do |table|
  # table is a Cucumber::Ast::Table
  table.hashes.each do |row|
    puts "name: " + row[:name]
    puts "value: " + row[:value]
  end

  body =  JSON.parse('{"body": "IndoorTemperatureUpdated, 72, F\n"}')
  puts "body: " + body.inspect

  post "/test/events", body
end
