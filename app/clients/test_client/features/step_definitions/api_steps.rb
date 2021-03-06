require "jsonpath"
require "nokogiri"

Given(/^I set headers:$/) do |headers|
  headers.rows_hash.each { |k, v| header k, v }
end

Given(/^I send and accept (XML|JSON)$/) do |type|
  header "Accept", "application/#{type.downcase}"
  header "Content-Type", "application/#{type.downcase}"
end

Given(/^I send and accept HTML$/) do
  header "Accept", "text/html"
  header "Content-Type", "application/x-www-form-urlencoded"
end

When(/^I authenticate as the user "([^"]*)" with the password "([^"]*)"$/) do |user, pass|
  authorize user, pass
end

When(/^I digest\-authenticate as the user "(.*?)" with the password "(.*?)"$/) do |user, pass|
  digest_authorize user, pass
end

When(/^I send a POST request (?:for|to) "([^"]*)"(?: with the following:)?$/) do |*args|
  path = args.shift
  body = JSON.parse(args.shift)
  post path, body
end

When(/^I send a (GET|PUT|DELETE) request (?:for|to) "([^"]*)"(?: with the following:)?$/) do |*args|
  request_type = args.shift
  path = args.shift
  input = args.shift

  request_opts = { method: request_type.downcase.to_sym }

  unless input.nil?
    if input.class == Cucumber::Ast::Table
      request_opts[:params] = input.rows_hash
    else
      request_opts[:input] = input
    end
  end

  @last_request_body = request_opts

  request path, request_opts
end

Then(/^show me the response$/) do
  if last_response.headers["Content-Type"] =~ /json/
    json_response = JSON.parse(last_response.body)
    puts JSON.pretty_generate(json_response)
  elsif last_response.headers["Content-Type"] =~ /xml/
    puts Nokogiri::XML(last_response.body)
  else
    puts last_response.headers
    puts last_response.body
  end
end

Then(/^I should get a response code of "([^"]*)"$/) do |status|
  if respond_to? :should
    last_response.status.should == status.to_i
  else
    assert_equal status.to_i, last_response.status
  end
end

Then(/^the JSON response should (not)?\s?have "([^"]*)" with the text "([^"]*)"$/) do |negative, json_path, text|
  json    = JSON.parse(last_response.body)
  results = JsonPath.new(json_path).on(json).to_a.map(&:to_s)

  if respond_to?(:should)
    if negative.present?
      results.should_not include(text)
    else
      results.should include(text)
    end
  elsif negative.present?
    assert !results.include?(text)
  else
    assert results.include?(text)
  end
end

Then(/^the XML response should have "([^"]*)" with the text "([^"]*)"$/) do |xpath, text|
  parsed_response = Nokogiri::XML(last_response.body)
  elements = parsed_response.xpath(xpath)
  if respond_to?(:should)
    elements.should_not be_empty, "could not find #{xpath} in:\n#{last_response.body}"
    elements.find { |e| e.text == text }.should_not be_nil, "found elements but could not find #{text} in:\n#{elements.inspect}"
  else
    assert !elements.empty?, "could not find #{xpath} in:\n#{last_response.body}"
    assert elements.find { |e| e.text == text }, "found elements but could not find #{text} in:\n#{elements.inspect}"
  end
end

Then "the JSON response should be:" do |json|
  expected = JSON.parse(json)
  actual = JSON.parse(last_response.body)

  if respond_to?(:should)
    actual.should == expected
  else
    assert_equal actual, response
  end
end
