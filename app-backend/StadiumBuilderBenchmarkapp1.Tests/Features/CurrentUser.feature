Feature: Signed-in person
    GET /api/auth/me tells the caller who is signed in on the current session.

Scenario Outline: A signed-in person asks who is signed in
    Given I am signed in as "<email>"
    When I ask who is signed in
    Then the response status code is 200
    And the response describes the user "<name>" with email "<email>" and role "<role>"

Examples:
    | name          | email                    | role     |
    | File Importer | fileimporter@digiata.com | Importer |
    | Approver User | approver@digiata.com     | Approver |

Scenario: Asking without a session is refused
    When I ask who is signed in
    Then the response status code is 401

Scenario: Asking with an unknown session token is refused
    Given my session cookie is "made-up-token"
    When I ask who is signed in
    Then the response status code is 401
