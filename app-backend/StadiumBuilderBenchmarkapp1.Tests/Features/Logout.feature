Feature: Sign out
    POST /api/auth/logout ends the current session and clears the session cookie.

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
