Feature: FakePlate
  In order to test Nexia Dealer
  As a tester
  I want to seed the event_store with fake events

  Scenario: Indoor Temperature
    When I send the following test events:
    # TODO: Add occurred at for each event...
    | name                     | value |
    | IndoorTemperatureUpdated | 72.1  |
    | IndoorTemperatureUpdated | 72.2  |
    | IndoorTemperatureUpdated | 72.3  |


    # When I send a POST request to "/test/events" with the body:
    #   """
    #   {"body": "IndoorTemperatureUpdated, 72, F\n"}
    #   """
    # Then I should get a response code of "200"