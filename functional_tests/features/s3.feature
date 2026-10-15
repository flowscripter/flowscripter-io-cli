Feature: S3 IO commands

  Note: these scenarios use the real @flowscripter/io-plugin-s3 from npm
  (installed by before_all) against a local moto S3 server started by
  before_all.

  Background:
    Given an empty S3 bucket

  Scenario: list shows an object that was written
    Given an S3 object "data/a.txt" containing "hello"
    When the executable stdout is captured for "list --location.protocol=s3 --location.s3.bucket={bucket} --location.s3.endpoint={endpoint} --location.s3.region=us-east-1 --location.s3.accessKeyId=test --location.s3.secretAccessKey=test --location.s3.path=data"
    Then the captured process should complete with exit code 0
    And the stdout should contain "a.txt"

  Scenario: get-properties reports size
    Given an S3 object "data/a.txt" containing "hello"
    When the executable stdout is captured for "get-properties --location.protocol=s3 --location.s3.bucket={bucket} --location.s3.endpoint={endpoint} --location.s3.region=us-east-1 --location.s3.accessKeyId=test --location.s3.secretAccessKey=test --location.s3.path=data --location.s3.filename=a.txt"
    Then the captured process should complete with exit code 0
    And the stdout should contain '"size": 5'

  Scenario: copy duplicates an object, leaving the original in place
    Given an S3 object "data/a.txt" containing "hello"
    When the executable stdout is captured for "copy --source.protocol=s3 --source.s3.bucket={bucket} --source.s3.endpoint={endpoint} --source.s3.region=us-east-1 --source.s3.accessKeyId=test --source.s3.secretAccessKey=test --source.s3.path=data --source.s3.filename=a.txt --dest.protocol=s3 --dest.s3.bucket={bucket} --dest.s3.endpoint={endpoint} --dest.s3.region=us-east-1 --dest.s3.accessKeyId=test --dest.s3.secretAccessKey=test --dest.s3.path=data --dest.s3.filename=b.txt"
    Then the captured process should complete with exit code 0
    And the S3 object "data/b.txt" should contain "hello"
    And the S3 object "data/a.txt" should contain "hello"

  Scenario: copy uploads a local file to S3
    Given a temporary working directory
    And a file "a.txt" containing "hello" in the working directory
    When the executable stdout is captured for "copy --source.protocol=file --source.file.path={workdir} --source.file.filename=a.txt --dest.protocol=s3 --dest.s3.bucket={bucket} --dest.s3.endpoint={endpoint} --dest.s3.region=us-east-1 --dest.s3.accessKeyId=test --dest.s3.secretAccessKey=test --dest.s3.path=up --dest.s3.filename=a.txt"
    Then the captured process should complete with exit code 0
    And the S3 object "up/a.txt" should contain "hello"

  Scenario: copy downloads an object to a local file
    Given a temporary working directory
    And an S3 object "data/a.txt" containing "hello"
    When the executable stdout is captured for "copy --source.protocol=s3 --source.s3.bucket={bucket} --source.s3.endpoint={endpoint} --source.s3.region=us-east-1 --source.s3.accessKeyId=test --source.s3.secretAccessKey=test --source.s3.path=data --source.s3.filename=a.txt --dest.protocol=file --dest.file.path={workdir} --dest.file.filename=down.txt"
    Then the captured process should complete with exit code 0
    And a file "down.txt" should exist in the working directory

  Scenario: hash outputs the expected sha256 digest
    Given an S3 object "data/a.txt" containing "hello"
    When the executable stdout is captured for "hash --location.protocol=s3 --location.s3.bucket={bucket} --location.s3.endpoint={endpoint} --location.s3.region=us-east-1 --location.s3.accessKeyId=test --location.s3.secretAccessKey=test --location.s3.path=data --location.s3.filename=a.txt"
    Then the captured process should complete with exit code 0
    And the stdout should contain "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"

  Scenario: delete removes an object
    Given an S3 object "data/a.txt" containing "hello"
    When the executable stdout is captured for "delete --location.protocol=s3 --location.s3.bucket={bucket} --location.s3.endpoint={endpoint} --location.s3.region=us-east-1 --location.s3.accessKeyId=test --location.s3.secretAccessKey=test --location.s3.path=data --location.s3.filename=a.txt"
    Then the captured process should complete with exit code 0
    And the S3 object "data/a.txt" should not exist
