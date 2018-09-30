DISABLED_STATUSES = ["OPTED OUT", "NOT ENROLLED IN A NEXIA HOME ACCOUNT", "INCOMPATIBLE"].freeze

Given(/^I am logged into the dealer portal$/) do
  login_via_single_sign_on
end

Given(/^I have devices$/) do
  [
    { dealer_uuid: dealer_uuid, device_id: "ABCD1234" },
    { dealer_uuid: dealer_uuid, device_id: "B987654B" }
  ].each { |device| add_device(device) }
end

Given(/^I have no devices$/) do
end

Given(/^I have a device$/) do
  add_device(dealer_uuid: dealer_uuid, device_id: "ABCD1234")
  @device = devices.first
end

Given(/^I have registered the customer's device$/) do
  add_device(dealer_uuid: dealer_uuid, device_id: @device_id)
end

Given(/^the customer has not opted in on Nexia Home to share the device data$/) do
  pending # express the regexp above with the code you wish you had
  # @response_device['status'].should == "OPTED OUT"
end

Given(/^the customer has opted in on Nexia Home to share the device data$/) do
  @device[:status] = "OPTED_IN"
end

When(/^I update the following attributes:$/) do |table|
  device_details = table.hashes.first
  patch "/api/dealers/#{dealer_uuid}/devices/#{device_ids.first}", device_details
  last_response.status.should == 200
end

When(/^I enter the device details which include the following:$/) do |device_details|
  device_details.map_headers!(/device id/ => "deviceId")
  @device_details = device_details.hashes.first.merge({ dealerUuid: dealer_uuid })
end

When(/^I save the device$/) do
  post "/api/dealers/#{dealer_uuid}/devices", @device_details
  last_response.status.should == 200
end

When(/^I view the device list$/) do
  get "/api/dealers/#{dealer_uuid}/devices"
  last_response.status.should == 200
end

When(/^I delete a device$/) do
  id = device_ids.first
  delete "/api/dealers/#{dealer_uuid}/devices/#{id}"
end

When(/^I view the dashboard$/) do
  # noop - only UI knows about this
end

When(/^I fetch the device$/) do
  get "/api/dealers/#{dealer_uuid}/devices/#{@device[:device_id]}"
end

Then(/^I should see the device in my device list$/) do
  expected_device = merge_nexia_home_attributes(
    {
      "deviceId" => "ABCD1234",
      "isNew" => false,
      "note" => "Jane Doe",
      "dealerUuid" => dealer_uuid,
      "name" => "Control 1",
      "zoningEnabled" => nil,
      "firmwareVersion" => INCOMPATIBLE_FIRMWARE_VERSION,
      "firmwareUpdateRequired" => true
    }, "INCOMPATIBLE"
  )
  actual_device = sanitize_device(JSON.parse(last_response.body))
  actual_device.should == expected_device
end

INCOMPATIBLE_FIRMWARE_VERSION = (NexiaDealer::Device::MINIMUM_FIRMWARE_VERSION - 1).to_s
Then(/^my device list is displayed$/) do
  expected_devices = [
    merge_nexia_home_attributes(
      {
        "deviceId" => "ABCD1234",
        "name" => "Control 1",
        "zoningEnabled" => nil,
        "isNew" => false,
        "dealerUuid" => dealer_uuid,
        "note" => "",
        "firmwareVersion" => INCOMPATIBLE_FIRMWARE_VERSION,
        "firmwareUpdateRequired" => true
      },
      "INCOMPATIBLE"
    ),
    merge_nexia_home_attributes(
      "deviceId" => "B987654B",
      "name" => "Control 1",
      "zoningEnabled" => nil,
      "isNew" => false,
      "dealerUuid" => dealer_uuid,
      "note" => "",
      "firmwareVersion" => "1371457691",
      "firmwareUpdateRequired" => false,
      "status" => "OPTED OUT"
    )
  ]
  actual_devices = sanitize_devices(JSON.parse(last_response.body))
  actual_devices.should == expected_devices
end

Then(/^I should get the updated device$/) do
  expected_device = merge_nexia_home_attributes(
    {
      "deviceId" => "ABCD1234",
      "isNew" => false,
      "note" => "John Doe",
      "dealerUuid" => dealer_uuid,
      "name" => "Control 1",
      "zoningEnabled" => nil,
      "firmwareVersion" => INCOMPATIBLE_FIRMWARE_VERSION,
      "firmwareUpdateRequired" => true
    },
    "INCOMPATIBLE"
  )
  actual_device = sanitize_device(JSON.parse(last_response.body))
  actual_device.should == expected_device
end

Then(/^I can view current system status, current alarms and zone status \(if zoned system\)$/) do
  pending # 404ing...how to enable event streams for test?
  get "/stream/current_status/#{@device[:device_id]}"
  expect(last_response.status).to eq(200)
  get "/stream/alarms/#{@device[:device_id]}"
  expect(last_response.status).to eq(200)
end

Then(/^the device appears in my device list$/) do
  @response_device = JSON.parse(last_response.body).first
  @response_device["deviceId"].should == @device[:device_id]
end

Then(/^I can view its dashboard$/) do
  pending
  @response_device["status"].should == "OPTED IN"
end

Then(/^I cannot view its dashboard$/) do
  DISABLED_STATUSES.should include(@response_device["status"])
end

Given(/^the customer has not enrolled the device in Nexia Home$/) do
  pending
end

Then(/^the status of the device in the list indicates customer has not enrolled in Nexia Home$/) do
  pending
end

Then(/^the status of the device in the list indicates customer has not given consent to view$/) do
  pending # express the regexp above with the code you wish you had
end

Then(/^the status of the device in the list indicates firmware is not valid$/) do
  @response_device["status"].should == "INCOMPATIBLE"
end

Then(/^I should get the device$/) do
  expected_device = merge_nexia_home_attributes(
    {
      "deviceId" => "ABCD1234",
      "isNew" => false,
      "note" => "",
      "dealerUuid" => dealer_uuid,
      "name" => "Control 1",
      "zoningEnabled" => nil,
      "firmwareVersion" => INCOMPATIBLE_FIRMWARE_VERSION,
      "firmwareUpdateRequired" => true
    },
    "INCOMPATIBLE"
  )
  actual_device = sanitize_device(JSON.parse(last_response.body))
  actual_device.should == expected_device
end

CAN_VIEW = Transform(/^(true|false)$/) do |can_view|
  can_view == "true"
end

Then(/^I (#{CAN_VIEW}) its dashboard$/) do |can_view|
  actual_devices = sanitize_devices(JSON.parse(last_response.body))
  actual_device = actual_devices.select { |device| device["deviceId"] == @device_id }.first

  if can_view
    actual_device["status"].should == "OPTED IN"
  else
    DISABLED_STATUSES.should include(actual_device["status"])
  end
end
