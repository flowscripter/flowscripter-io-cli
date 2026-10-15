import uuid

from behave import given, then


@given('an empty S3 bucket')
def step_impl(context):
    context.s3_bucket = 'functest-{}'.format(uuid.uuid4().hex[:12])
    context.s3_client.create_bucket(Bucket=context.s3_bucket)


@given('an S3 object "{key}" containing "{content}"')
def step_impl(context, key, content):
    context.s3_client.put_object(Bucket=context.s3_bucket, Key=key, Body=content.encode('utf-8'))


def get_object(context, key):
    try:
        return context.s3_client.get_object(Bucket=context.s3_bucket, Key=key)['Body'].read()
    except context.s3_client.exceptions.NoSuchKey:
        return None


@then('the S3 object "{key}" should contain "{content}"')
def step_impl(context, key, content):
    body = get_object(context, key)
    assert body == content.encode('utf-8'), 'unexpected S3 object {!r}: {!r}'.format(key, body)


@then('the S3 object "{key}" should not exist')
def step_impl(context, key):
    body = get_object(context, key)
    assert body is None, 'expected S3 object {!r} not to exist'.format(key)
