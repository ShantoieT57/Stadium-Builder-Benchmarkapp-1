Feature: Sign out
    POST /api/auth/logout ends every session of the signed-in person and clears the session cookie.

Scenario: After signing out the old session cookie no longer works
    Given I am signed in as "fileimporter@digiata.com"
    When I sign out
    Then the response status code is 204
    And the session cookie is cleared
    When I ask who is signed in
    Then the response status code is 401

Scenario: Signing out without a session still succeeds
    When I sign out
    Then the response status code is 204

Scenario: Signing out ends every session of that person
    Given I am signed in as "fileimporter@digiata.com"
    And "fileimporter@digiata.com" also has a stored session "other device"
    When I sign out
    Then the response status code is 204
    And "fileimporter@digiata.com" has no stored sessions
    When I ask who is signed in using the session "other device"
    Then the response status code is 401

Scenario: Signing out does not end other people's sessions
    Given I am signed in as "approver@digiata.com"
    And I remember this session as "approver browser"
    And I am signed in as "fileimporter@digiata.com"
    When I sign out
    And I ask who is signed in using the session "approver browser"
    Then the response status code is 200
