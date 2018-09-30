Feature: Single Sign-On
  In order to seamlessly use Nexia Dealer with my comfort site account
  As a dealer
  I want to login through to Nexia Dealer through comfort site without re-entering my credentials

  # JSON bodies are AES-256 encrypted then Base64 encoded. Originals:
  #
  # POST /api/single-sign-on-link
  #   -> SingleSignOn::012094f5ad65c9f948b353c4bc3d82c42220cd5055f40b99d40a284314cc1de9::2013-05-15 07:02:38 -0600::BobTheDealersId4::dealer-guid-for-bob
  #   <- 2013-05-15 07:02:38 -0600::5c7c72a5be7549dae3dfb48f5bc296013b7a581343a350bb87d1475ec3bd0dbb::BobTheDealersId4::dealer-guid-for-bob::http://nexia-dealer.com/api/sessions
  #
  # POST /api/sessions
  #   -> SingleSignOn::012094f5ad65c9f948b353c4bc3d82c42220cd5055f40b99d40a284314cc1de9::2013-05-15 07:02:38 -0600::5c7c72a5be7549dae3dfb48f5bc296013b7a581343a350bb87d1475ec3bd0dbb::BobTheDealersId4::dealer-guid-for-bob::Bob Vila::[{\"name\": \"gentleman\"}, {\"name\": \"scholar\"}, {\"name\": \"builder_of_things\"}]

  Scenario: Single sign on through Comfortsite
    Given I am Comfortsite
    When I send a POST request to "/api/single-sign-on-link" with the body:
      """
      {"body": "LJJ39+L3fEungNwilKvrw7m5Gtx3Ye24dxMBs3vd8W0OVajcdSZU01pbIrZ+\ny/W+mFQbZPprPGNysSU9h8U4qTccMzah2ioM41o7fraZHsqdIuA9p7CyH2Nb\nn4eDTbs48vdJJwLJKVj1TS0vdIljKm/J5RT6H5dGmHIRjKTbXbiIZpBDEYiv\n3VjBMEZm+stm\n"}
      """
    Then I should get a response code of "201"
    And I should receive a message with an Expires header for the nonce
    And I should receive a message with a single sign on link and security information in clear text
      """
      {"body": "LJJ39+L3fEungNwilKvrw7m5Gtx3Ye24dxMBs3vd8W0OVajcdSZU01pbIrZ+\ny/W+mFQbZPprPGNysSU9h8U4qTccMzah2ioM41o7fraZHsqdIuA9p7CyH2Nb\nn4eDTbs4JN/afaKFMQgghA3K1dZT+zuq0hgz3ik6fgzAjxTvbHqt8K/ee56F\ngRCODb2pHfytpfpseQwSWpv2SnzJMrTd+2qgqgj/5R8v9L1roFbKR5pU87yT\n5fOn5/64eSCXpAkl7j1pnW8xJ5ZZQAaa7x7Q4+UZ1nLRQ9RVjcUveNaJNW0M\nXP8cc9QpoIkEAIeMKx6LE+7FEChaJXeJPa7f5OiO9TGF7/17UN4zhjSxzjTf\nxYLxmdsdhPS71xr7PfdDCcyd4B0POAhgO0gGHm8XPEF7GA==\n"}
      """
    When I send a POST request to "/api/sessions" using the previously received nonce
    Then the response should be the nexia dealer home page

  Scenario: Add Dealer to Dealers System
    Given I work for a dealer with dealer uuid "DEALER-GUID-FOR-BOB"
    And I'm the first person for the dealer to log into Nexia Dealer
    When I send a POST request to "/api/single-sign-on-link" with the body:
      """
      {"body": "LJJ39+L3fEungNwilKvrw7m5Gtx3Ye24dxMBs3vd8W0OVajcdSZU01pbIrZ+\ny/W+mFQbZPprPGNysSU9h8U4qTccMzah2ioM41o7fraZHspS/+UbrGgvRo6K\nqAsfG668JX3VV15pkjRg4/BFqL2M0xs4PKk2SGQW8K7XCPYe/kQFlBuWdncv\noXUAY3QoL7Kt\n"}
      """
    And I send a POST request to "/api/sessions" using the previously received nonce
    Then my dealer should be added to the database

