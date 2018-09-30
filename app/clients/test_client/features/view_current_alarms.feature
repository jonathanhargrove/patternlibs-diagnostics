Feature: View current alarms for a system
  In order to determine severity of an issue and resolve it offsite or determine what kind of technician to send to job (manage cost).
  As a dealer service manager,
  I want to be able to view current alarms for an HVAC system

Scenario: View a streaming list of alarms for an XL950
  Given I am logged into the dealer portal
  And I am subscribed to receive a stream of alarms
  When The XL950 publishes a list of alarms
  Then I can view a the list of current alarms for that system without refreshing the page
