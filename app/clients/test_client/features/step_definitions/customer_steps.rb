CUSTOMERS = {
  joe_smith: {
    first_name: "Joe",
    last_name: "Smith",
    address1: "123 Main St.",
    address2: "Suite 101",
    email: "joe_smith@example.com",
    phone: "5551113535",
    city: "Boulder",
    state: "CO",
    zip: "80305"
  },
  tom_flom: {
    first_name: "Tom",
    last_name: "Flom",
    address1: "321 Back St.",
    address2: "",
    email: "tom_flom@example.com",
    phone: "5550001212",
    city: "Denver",
    state: "CO",
    zip: "80401" }
}.freeze

Given(/^I add a customer "(.*?)"$/) do |customer_name|
  customer = CUSTOMERS[customer_name.snake_case.to_sym]
  customer[:dealer_uuid] = dealer_uuid
  post "/api/dealers/#{dealer_uuid}/customers", customer
end

When(/^I view the customer list$/) do
  get "/api/dealers/#{dealer_uuid}/customers"
end

Then(/^I can see the newly added customers$/) do |table|
  table_customers = snake_case_hash_keys(table.hashes)

  response_customers = snake_case_hash_keys(JSON.parse(last_response.body))

  table_customers.each_with_index do |table_customer, index|
    response_customer = response_customers[index]
    table_customer.each do |attr, value|
      expect(response_customer[attr]).to eq value
    end
  end
end
