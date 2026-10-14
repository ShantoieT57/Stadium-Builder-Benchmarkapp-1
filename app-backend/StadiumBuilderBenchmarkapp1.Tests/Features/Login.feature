Feature: Sign in
    POST /api/auth/login signs a person in with their email and password and
    starts a server-side session carried in an HTTP-only cookie.

Scenario Outline: A seeded person signs in with the correct email and password
    When I sign in with email "<email>" and password "Test123"
    Then the response status code is 200
    And the response describes the user "<name>" with email "<email>" and role "<role>"
    And an HTTP-only session cookie with SameSite Lax is set

Examples:
    | name          | email                    | role     |
    | File Importer | fileimporter@digiata.com | Importer |
    | Approver User | approver@digiata.com     | Approver |

Scenario: Email matching ignores letter case
    When I sign in with email "FileImporter@Digiata.COM" and password "Test123"
    Then the response status code is 200
    And the response describes the user "File Importer" with email "fileimporter@digiata.com" and role "Importer"

Scenario Outline: A wrong email or password gets the same refusal
    When I sign in with email "<email>" and password "<password>"
    Then the response status code is 401
    And the error message is "Invalid email or password"
    And no session cookie is set

Examples:
    | case                     | email                    | password |
    | wrong password           | fileimporter@digiata.com | Wrong123 |
    | password in wrong case   | approver@digiata.com     | test123  |
    | unknown email            | nobody@digiata.com       | Test123  |

Scenario Outline: A missing email or password is refused without saying which credential is wrong
    When I sign in with the request body <body>
    Then the response status code is 400
    And the error message is "Email and password are required"
    And no session cookie is set

Examples:
    | case             | body                                                |
    | no email         | {"password":"Test123"}                              |
    | empty email      | {"email":"","password":"Test123"}                   |
    | no password      | {"email":"fileimporter@digiata.com"}                |
    | blank password   | {"email":"fileimporter@digiata.com","password":" "} |
    | empty object     | {}                                                  |

Scenario: Credentials never appear in the logs or error messages
    When I sign in with email "fileimporter@digiata.com" and password "Wrong-Secret-42"
    And I sign in with email "approver@digiata.com" and password "Test123"
    Then the logs do not contain "Wrong-Secret-42"
    And the logs do not contain "Test123"
