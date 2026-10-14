Feature: Database location
    A relative SQLite database file name in the connection string is resolved against
    the application's own folder, so the same database is used no matter which folder
    the application is started from. Absolute paths and in-memory databases are used as given.

Scenario: By default the database file lives in the application folder
    Given the default application settings
    Then the database file used is "TransactionImport.db" in the application folder

Scenario: A relative database file name is resolved against the application folder
    Given the database connection string is "Data Source=data/Other.db"
    Then the database file used is "data/Other.db" in the application folder

Scenario: An absolute database path is used as given
    Given the database connection string names an absolute file "absolute-test.db" in the temp folder
    Then the database file used is that absolute file

Scenario: An in-memory database is used as given
    Given the database connection string is "Data Source=:memory:"
    Then the database file used is ":memory:"
