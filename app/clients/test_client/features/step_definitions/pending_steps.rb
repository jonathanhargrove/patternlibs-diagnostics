Given(/^I am subscribed to receive current statsu from an XL(\d+)$/) do |_arg1|
  pending # express the regexp above with the code you wish you had
end

When(/^The XL(\d+) publishes an update to its current status$/) do |_arg1|
  pending # express the regexp above with the code you wish you had
end

Then(/^I can view the updated current status for that system without refreshing the page$/) do
  pending # express the regexp above with the code you wish you had
end

Given(/^The following daily Y1 information was provided by the thermostat$/) do |_table|   # table is a Cucumber::Ast::Table
  # pending
end

Given(/^The following monthly Y1 data was provided by the thermostat$/) do |_table|
  # pending # express the regexp above with the code you wish you had
end

When(/^I enter the AUID for this thermostat$/) do
  pending
end

Then(/^I should see the following rollups$/) do |_table|
  pending
  # last_response.status.should == 200

  # table.map_headers! {|c| c.downcase.gsub(" ", "_")}
  # table.map_column!("period") {|c| c.downcase.gsub(" ", "_")}

  # last_response.body.should == table.hashes.keys
end

Given(/^I have a valid AUID for an XL(\d+)$/) do |_arg1|
  pending # express the regexp above with the code you wish you had
end

Then(/^I should be subscribed to receive a stream of information$/) do
  pending # express the regexp above with the code you wish you had
end

Given(/^I am subscribed to receive current status from an XL(\d+)$/) do |_arg1|
  pending # express the regexp above with the code you wish you had
end

Then(/^I can view live updated current status for that system$/) do
  pending # express the regexp above with the code you wish you had
end
