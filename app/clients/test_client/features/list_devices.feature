##Cucumber Feature

Feature: Device list
  As a dealer,
  In order to quickly provide diagnostics for a customer
  I want to see a list of devices that I can sort by customer name

  Background:
    Given I am logged into the dealer portal

  Scenario: Create new device
    When I enter the device details which include the following:
      | note     | device id |
      | Jane Doe | ABCD1234  |
    And I save the device
    Then I should see the device in my device list
    And I should get a response code of "200"

  Scenario: View device list
    Given I have devices
    When I view the device list
    Then my device list is displayed

  Scenario: Delete device
    Given I have devices
    When I delete a device
    Then I should get a response code of "204"

  Scenario: Failed to delete a device
    Given I have no devices
    When I delete a device
    Then I should get a response code of "404"

  Scenario: Edit device
    Given I have a device
    When I update the following attributes:
      | note     |
      | John Doe |
    Then I should get a response code of "200"
    And I should get the updated device

  Scenario: Get Device
    Given I have a device
    When I fetch the device
    Then I should get a response code of "200"
    And I should get the device

  Scenario Outline: XL950 device- customer opted in on Nexia Home
    Given I am logged into the dealer portal
    And the customer has <enrolled> a device in Nexia Home
    And the customer has <opted_in> on Nexia Home to share the device data
    And I have registered the customer's device
    When I view the device list
    Then I <can_view> its dashboard

  Examples:
    | enrolled | opted_in | can_view |
    | true     | true     | true     |
    | true     | false    | false    |
    | false    | true     | false    |
    | false    | false    | false    |
