Feature: View current status
  In order to determine severity of issue and resolve the issue offsite or determine the technician/tools to send to job (manage cost)
  As a dealer service manager.
  I want to see a current view of the system data as reported within the last five minutes
  And the view to automatically refresh when new state data is available

  Scenario: Subscribe to an XL950 for current status
    Given I have a valid AUID for an XL950
    When I enter the AUID to view current status
    Then I should be subscribed to receive a stream of information

  Scenario: View a stream of current status from an XL950
    Given I am subscribed to receive current status from an XL950
    When The XL950 publishes an update to its current status
    Then I can view live updated current status for that system