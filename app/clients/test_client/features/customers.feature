Feature: Customer List View
  In order to determine the status and location of my customers' equipment
  As a service manager,
  I want to see a list of of customers with their address, equipment, and status

Scenario: View list of customers
Given I am logged into the dealer portal
And I add a customer "Joe Smith"
And I add a customer "Tom Flom"
When I view the customer list
Then I can see the newly added customers
  | first name | last name | address1     | address2  | city    | state | zip   |
  | Joe        | Smith     | 123 Main St. | Suite 101 | Boulder | CO    | 80305 |
  | Tom        | Flom      | 321 Back St. |           | Denver  | CO    | 80401 |
