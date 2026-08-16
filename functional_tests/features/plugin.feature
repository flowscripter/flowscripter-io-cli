Feature: Plugin management

  Note: before_all installs @flowscripter/io-plugin-filesystem via
  plugin:add before any scenario runs (requires network access to the
  real npm registry). These scenarios just verify that succeeded.

  Scenario: Installed plugin is listed
    When the executable stdout is captured for "plugin:list"
    Then the captured process should complete with exit code 0
    And the stdout should contain "io-plugin-filesystem"
