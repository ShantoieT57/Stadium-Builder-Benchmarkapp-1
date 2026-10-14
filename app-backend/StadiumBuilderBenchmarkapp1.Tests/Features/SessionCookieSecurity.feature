Feature: Session cookie security
    The session cookie set by POST /api/auth/login (and cleared by POST /api/auth/logout)
    is marked Secure whenever the browser reached the API over HTTPS, including when it
    came through a reverse proxy on this machine (such as the front-end's /api rewrite)
    that reports the original scheme in X-Forwarded-Proto. The SessionCookieSecure
    setting (Auto, Always or Never) can override this.

Scenario: Signing in over plain http does not mark the cookie Secure
    When I sign in with email "fileimporter@digiata.com" and password "Test123"
    Then the response status code is 200
    And the session cookie is not marked Secure

Scenario Outline: Signing in over HTTPS through a proxy on this machine marks the cookie Secure
    When I sign in as "fileimporter@digiata.com" through an HTTPS proxy at "<proxy address>"
    Then the response status code is 200
    And the session cookie is marked Secure

Examples:
    | proxy address |
    | 127.0.0.1     |
    | ::1           |

Scenario: A forwarded scheme from an untrusted address is ignored
    When I sign in as "fileimporter@digiata.com" through an HTTPS proxy at "203.0.113.10"
    Then the response status code is 200
    And the session cookie is not marked Secure

Scenario: Signing out over HTTPS through a proxy clears the cookie as Secure
    Given I am signed in as "fileimporter@digiata.com"
    When I sign out through an HTTPS proxy at "127.0.0.1"
    Then the response status code is 204
    And the session cookie is marked Secure

Scenario: The Always setting marks the cookie Secure even over plain http
    Given the session cookie Secure setting is "Always"
    When I sign in with email "fileimporter@digiata.com" and password "Test123"
    Then the response status code is 200
    And the session cookie is marked Secure

Scenario: The Never setting leaves the cookie without Secure even over HTTPS
    Given the session cookie Secure setting is "Never"
    When I sign in as "fileimporter@digiata.com" through an HTTPS proxy at "127.0.0.1"
    Then the response status code is 200
    And the session cookie is not marked Secure
