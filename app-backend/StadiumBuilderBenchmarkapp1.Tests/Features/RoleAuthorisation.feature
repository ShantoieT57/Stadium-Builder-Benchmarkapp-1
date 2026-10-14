Feature: Role authorisation
    The back end enforces role rules itself through the reusable "ImporterOnly" and
    "ApproverOnly" authorisation policies. A signed-in person without the required
    role gets 403; a caller without a valid session gets 401. The policies are
    exercised through test-only operations guarded by each policy.

Scenario Outline: A role-restricted operation allows only the matching role
    Given I am signed in as "<email>"
    When I call the operation restricted to the "<policy>" policy
    Then the response status code is <status>

Examples:
    | email                    | policy       | status |
    | fileimporter@digiata.com | ImporterOnly | 200    |
    | fileimporter@digiata.com | ApproverOnly | 403    |
    | approver@digiata.com     | ApproverOnly | 200    |
    | approver@digiata.com     | ImporterOnly | 403    |

Scenario Outline: A role-restricted operation refuses callers without a session
    When I call the operation restricted to the "<policy>" policy
    Then the response status code is 401

Examples:
    | policy       |
    | ImporterOnly |
    | ApproverOnly |

Scenario: A role-restricted operation refuses an expired session
    Given I am signed in as "fileimporter@digiata.com"
    When 61 minutes pass
    And I call the operation restricted to the "ImporterOnly" policy
    Then the response status code is 401
