Feature: Device dashboard view
 As a dealer,
 I want to view detailed data for a device such as current system status, alarms, etc.
 So that I can provide remote troubleshooting assistance

Scenario: View device dashboard
Given I can connect to Nexia Home
And I am logged into the dealer portal
And I have a device
When I view the dashboard
Then I can view current system status, current alarms and zone status (if zoned system)

Scenario: XL950 device- customer opted in on Nexia Home
Given I am logged into the dealer portal
And I have a device
And the customer has opted in on Nexia Home to share the device data
When I view the device list
Then the device appears in my device list
And I can view its dashboard

Scenario: XL950 device- customer has not enrolled in Nexia Home
Given I am logged into the dealer portal
And I have a device
And the customer has not enrolled the device in Nexia Home
When I view the device list
Then the device appears in my device list
And I cannot view its dashboard
And the status of the device in the list indicates customer has not enrolled in Nexia Home

Scenario: XL950 device- no customer opt in on Nexia Home
Given I am logged into the dealer portal
And I have a device
And the customer has not opted in on Nexia Home to share the device data
When I view the device list
Then the device appears in my device list
And I cannot view its dashboard
And the status of the device in the list indicates customer has not given consent to view

Scenario: XL950 device- firmware not valid
Given I am logged into the dealer portal
And I have a device
And the customer has not updated the device firmware to 2.2.2 or greater
When I view the device list
Then the device appears in my device list
And I cannot view its dashboard
And the status of the device in the list indicates firmware is not valid
