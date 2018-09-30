ENROLLED = Transform(/^(true|false)$/) do |enrolled|
  enrolled == "true"
end

OPTED_IN = Transform(/^(true|false)$/) do |opted_in|
  opted_in == "true"
end

NOT_ENROLLED_AUID = "C987654C".freeze
OPTED_OUT_AUID = "B987654B".freeze
OPTED_IN_AUID = "A987654A".freeze
OPTED_IN_BUT_INCOMPATIBLE_AUID = "ABCD1234".freeze

Given(/^I can connect to Nexia Home$/) do
  test_connection_to_nexia_home
end

Given(/^the customer has (#{ENROLLED}) a device in Nexia Home$/) do |enrolled|
  @enrolled = enrolled
end

Given(/^the customer has (#{OPTED_IN}) on Nexia Home to share the device data$/) do |opted_in|
  @device_id = if @enrolled
                 if opted_in
                   OPTED_IN_AUID
                 else
                   OPTED_OUT_AUID
                 end
               else
                 NOT_ENROLLED_AUID
               end
end

Given(/^the customer has not updated the device firmware to (\d+)\.(\d+)\.(\d+) or greater$/) do |major, minor, build|
  if [major, minor, build] == [2, 2, 2]
    @device_id = OPTED_IN_BUT_INCOMPATIBLE_AUID
  end
end
