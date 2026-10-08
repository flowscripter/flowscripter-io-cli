Feature: IO commands

  Background:
    Given a temporary working directory

  Scenario: list shows a file that was written
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "list --location.protocol=file --location.file.path={workdir}"
    Then the captured process should complete with exit code 0
    And the stdout should contain "a.txt"

  Scenario: get-properties reports size
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "get-properties --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt"
    Then the captured process should complete with exit code 0
    And the stdout should contain '"size": 5'

  Scenario: set-properties reports success
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "set-properties --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt --properties.file.mode=420"
    Then the captured process should complete with exit code 0
    And the stdout should contain "Updated properties"

  Scenario: copy duplicates a file, leaving the original in place
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "copy --source.protocol=file --source.file.path={workdir} --source.file.filename=a.txt --dest.protocol=file --dest.file.path={workdir} --dest.file.filename=b.txt"
    Then the captured process should complete with exit code 0
    And a file "b.txt" should exist in the working directory
    And a file "a.txt" should exist in the working directory
    And the stdout should contain "path: file/js -> file/js"

  Scenario: move relocates a file
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "move --source.protocol=file --source.file.path={workdir} --source.file.filename=a.txt --dest.protocol=file --dest.file.path={workdir} --dest.file.filename=c.txt"
    Then the captured process should complete with exit code 0
    And a file "c.txt" should exist in the working directory
    And a file "a.txt" should not exist in the working directory

  Scenario: delete removes a file
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "delete --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt"
    Then the captured process should complete with exit code 0
    And a file "a.txt" should not exist in the working directory

  Scenario: hash outputs the expected sha256 digest
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "hash --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt"
    Then the captured process should complete with exit code 0
    And the stdout should contain "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"

  Scenario: copy with a pattern copies only the matching files
    Given a file "a.txt" containing "hello" in the working directory
    And a file "b.log" containing "hello" in the working directory
    And a folder "out" in the working directory
    When the executable stdout is captured for "copy --source.protocol=file --source.file.path={workdir} --source.file.pattern=*.txt --dest.protocol=file --dest.file.path={workdir}/out"
    Then the captured process should complete with exit code 0
    And a file "out/a.txt" should exist in the working directory
    And a file "out/b.log" should not exist in the working directory

  Scenario: list recursive descends into sub folders
    Given a folder "sub" in the working directory
    And a file "sub/c.log" containing "hello" in the working directory
    When the executable stdout is captured for "list --location.protocol=file --location.file.path={workdir} --recursive"
    Then the captured process should complete with exit code 0
    And the stdout should contain "sub/c.log"

  Scenario: list with a regex only shows the matching items
    Given a file "a.txt" containing "hello" in the working directory
    And a file "b.log" containing "hello" in the working directory
    When the executable stdout is captured for "list --location.protocol=file --location.file.path={workdir} --regex=log$"
    Then the captured process should complete with exit code 0
    And the stdout should contain "b.log"
    And the stdout should not contain "a.txt"

  Scenario: hash outputs the expected md5 digest
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "hash --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt --algorithm=md5"
    Then the captured process should complete with exit code 0
    And the stdout should contain "5d41402abc4b2a76b9719d911017c592"

  Scenario: get-properties fails for a missing file
    When the executable stdout is captured for "get-properties --location.protocol=file --location.file.path={workdir} --location.file.filename=missing.txt"
    Then the captured process should complete with exit code 3
    And the stderr should contain "no such file or directory"

  Scenario: delete fails for a missing file
    When the executable stdout is captured for "delete --location.protocol=file --location.file.path={workdir} --location.file.filename=missing.txt"
    Then the captured process should complete with exit code 3
    And the stderr should contain "no such file or directory"

  Scenario: copy fails for a missing source and creates no destination
    When the executable stdout is captured for "copy --source.protocol=file --source.file.path={workdir} --source.file.filename=missing.txt --dest.protocol=file --dest.file.path={workdir} --dest.file.filename=b.txt"
    Then the captured process should complete with exit code 3
    And the stderr should contain "no such file or directory"
    And a file "b.txt" should not exist in the working directory

  Scenario: list rejects a single file location
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "list --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt"
    Then the captured process should complete with exit code 3
    And the stderr should contain "list needs a folder or pattern location"

  Scenario: hash rejects a folder location
    When the executable stdout is captured for "hash --location.protocol=file --location.file.path={workdir}"
    Then the captured process should complete with exit code 3
    And the stderr should contain "hash needs a single entry location"

  Scenario: an unknown location protocol is rejected
    When the executable stdout is captured for "list --location.protocol=bogus --location.file.path={workdir}"
    Then the captured process should complete with exit code 1
    And the stderr should contain "illegal value"

  Scenario: an unknown hash algorithm is rejected
    Given a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "hash --location.protocol=file --location.file.path={workdir} --location.file.filename=a.txt --algorithm=crc"
    Then the captured process should complete with exit code 1
    And the stderr should contain "illegal value"
