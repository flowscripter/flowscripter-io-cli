import os
import tempfile

from behave import given, then


@given('a temporary working directory')
def step_impl(context):
    context.workdir = tempfile.mkdtemp(prefix='flowscripter-io-cli-functest-')


@given('a file "{name}" containing "{content}" in the working directory')
def step_impl(context, name, content):
    with open(os.path.join(context.workdir, name), 'w') as f:
        f.write(content)


@then('a file "{name}" should exist in the working directory')
def step_impl(context, name):
    path = os.path.join(context.workdir, name)
    assert os.path.exists(path), 'expected {!r} to exist'.format(path)


@then('a file "{name}" should not exist in the working directory')
def step_impl(context, name):
    path = os.path.join(context.workdir, name)
    assert not os.path.exists(path), 'expected {!r} not to exist'.format(path)
