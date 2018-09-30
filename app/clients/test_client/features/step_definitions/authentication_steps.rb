Given(/^I am Comfortsite$/) do
  # noop
end

Given(/^I work for a dealer with dealer uuid "(.*?)"$/) do |dealer_uuid|
  @dealer_uuid = dealer_uuid
end

Given(/^I'm the first person for the dealer to log into Nexia Dealer$/) do
  Persistence.database[:dealers].where(uuid: @dealer_uuid).all.should be_empty
end

When(%r{^I send a POST request to "/api/single\-sign\-on\-link" with the body:$}) do |*args|
  encrypted_nonce_request = JSON.parse(args.shift)["body"]
  nonce_request = NexiaMessages::Auth::NonceRequest.decrypt(encrypted_nonce_request)
  nonce_request_builder = NexiaMessages::Auth::Test::NonceRequestBuilder.from_nonce_request(nonce_request)
  nonce_request_builder.timestamp = Time.now

  nonce_response = get_single_sign_on_link(nonce_request_builder.build)
  @timestamp = nonce_response.timestamp
  @nonce          = nonce_response.nonce
  @dealer_user_id = nonce_response.foreign_user_id

  @dealer_guid    = nonce_response.dealer_guid
  @sessions_uri   = nonce_response.url
end

Then(/^I should receive a message with an Expires header for the nonce$/) do
  last_response.headers["Expires"].should_not be_nil
end

Then(/^I should receive a message with a single sign on link and security information in clear text$/) do |expected_security_info|
  @expected_security_info = JSON.parse(expected_security_info)["body"]
  decrypted_access_token = NexiaMessages::Auth::AccessToken.decrypt(@expected_security_info)

  expected_nonce   = decrypted_access_token.nonce
  expected_user_id = decrypted_access_token.foreign_user_id
  expected_dealer_guid = decrypted_access_token.dealer_guid

  Time.now.should be_within(5).of(@timestamp)
  expect(expected_nonce.length).to eq(@nonce.length)
  expect(expected_user_id).to eq(@dealer_user_id)
  expect(expected_dealer_guid).to eq(@dealer_guid)
  expect(URI.parse(@sessions_uri)).to be_a(URI::HTTP)
end

When(%r{^I send a POST request to "/api/sessions" using the previously received nonce$}) do
  body = JSON.parse(last_response.body)["body"]
  descrypted_nonce_response = NexiaMessages::Auth::NonceResponse.decrypt(body)
  get_single_sign_on_session(
    descrypted_nonce_response,
    [{ "name" => "gentleman" }, { "name" => "scholar" }, { "name" => "builder_of_things" }]
  )
end

Then(/^the session should be set to expire$/) do
  last_response.headers["set-cookie"].should match(/Expires/i)
end

Then(/^the response should be the nexia dealer home page$/) do
  last_response.headers["Content-Type"].should match(/text\/html/)
  last_response.body.should match(/<div id="main_content">/)
end

Then(/^my dealer should be added to the database$/) do
  Persistence.database[:dealers].where(uuid: @dealer_guid).all.should_not be_empty
end
