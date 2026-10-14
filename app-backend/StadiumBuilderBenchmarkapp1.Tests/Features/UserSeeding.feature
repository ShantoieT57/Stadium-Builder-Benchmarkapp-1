Feature: Ready-to-use people
    On startup the application seeds the two ready-to-use people, storing their
    passwords only as salted hashes. Seeding is safe to run more than once.

Scenario: The two ready-to-use people exist after startup
    Then the stored users are
        | name          | email                    | role     |
        | Approver User | approver@digiata.com     | Approver |
        | File Importer | fileimporter@digiata.com | Importer |

Scenario: Passwords are stored only as salted hashes
    Then no stored password hash contains "Test123"
    And every stored password hash is different

Scenario: Seeding again does not duplicate the people
    When the user seeding runs again
    Then there are 2 stored users

Scenario: Seeding never logs the password
    Then the logs do not contain "Test123"
