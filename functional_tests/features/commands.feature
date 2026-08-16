Feature: IO commands

  Background:
    Given a temporary working directory

  Scenario: list shows a file that was written
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "list {workdir}"
    Then the captured process should complete with exit code 0
    And the stdout should contain "a.txt"

  Scenario: get-properties reports size
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "get-properties {workdir}/a.txt"
    Then the captured process should complete with exit code 0
    And the stdout should contain '"size": 5'

  Scenario: set-properties reports success
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "set-properties {workdir}/a.txt --mode 420"
    Then the captured process should complete with exit code 0
    And the stdout should contain "Updated properties"

  Scenario: copy duplicates a file, leaving the original in place
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "copy {workdir}/a.txt {workdir}/b.txt"
    Then the captured process should complete with exit code 0
    And a file "b.txt" should exist in the working directory
    And a file "a.txt" should exist in the working directory

  Scenario: move relocates a file
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "move {workdir}/a.txt {workdir}/c.txt"
    Then the captured process should complete with exit code 0
    And a file "c.txt" should exist in the working directory
    And a file "a.txt" should not exist in the working directory

  Scenario: delete removes a file
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "delete {workdir}/a.txt"
    Then the captured process should complete with exit code 0
    And a file "a.txt" should not exist in the working directory

  Scenario: hash outputs the expected sha256 digest
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "hash {workdir}/a.txt"
    Then the captured process should complete with exit code 0
    And the stdout should contain "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
