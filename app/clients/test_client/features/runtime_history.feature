Feature: Runtime History
  As a dealer service manager.
  I want to look for trends in runtime history as an indicator of a possible system performance issues
  In order to determine the severity of the issue and resolve the issue offsite or determine the technician/tools to send to job (manage cost).

  #Y1 is 1st stage cooling
  Scenario: View a summary of Y1 Heating rollups for an XXL thermostat
    Given The following daily Y1 information was provided by the thermostat
      | Day Ago   | Runtime Hours | Cycle Count |
      | 0         | 7             | 4           |
      | 1         | 12            | 14          |
      | 2         | 6             | 2           |
      | 3         | 12            | 3           |
      | 4         | 11            | 1           |
      | 5         | 4             | 4           |
      | 6         | 3             | 2           |
    And The following monthly Y1 data was provided by the thermostat
      | Month Ago | Runtime Hours | Cycle Count |
      | 0         | 143           | 42          |
      | 1         | 163           | 49          |

    When I enter the AUID for this thermostat
    Then I should see the following rollups
      | Period        | Runtime Hours | Cycle Count |
      | 24 hours      | 7             | 4           |
      | 7 Days        | 55            | 30          | 
      | Current Month | 143           | 42          |
      | Last Month    | 163           | 49          |

