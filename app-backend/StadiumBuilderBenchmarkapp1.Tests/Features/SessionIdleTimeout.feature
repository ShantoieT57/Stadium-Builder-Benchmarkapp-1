Feature: Session idle timeout
    A session with no authenticated request for more than 60 minutes expires and is
    refused exactly like having no session. Every successful authenticated request
    restarts the 60 minutes. Shown here through GET /api/auth/me.

Scenario: A session used within 60 minutes still works
    Given I am signed in as "fileimporter@digiata.com"
    When 59 minutes pass
    And I ask who is signed in
    Then the response status code is 200

Scenario: A session idle for exactly 60 minutes still works
    Given I am signed in as "fileimporter@digiata.com"
    When 60 minutes pass
    And I ask who is signed in
    Then the response status code is 200

Scenario: Each request restarts the 60 minutes
    Given I am signed in as "approver@digiata.com"
    When 59 minutes pass
    And I ask who is signed in
    Then the response status code is 200
    When 59 minutes pass
    And I ask who is signed in
    Then the response status code is 200

Scenario: A session idle for more than 60 minutes is refused and removed
    Given I am signed in as "fileimporter@digiata.com"
    When 61 minutes pass
    And I ask who is signed in
    Then the response status code is 401
    And "fileimporter@digiata.com" has no stored sessions
