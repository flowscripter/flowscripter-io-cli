import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from behave import when, then
from support.subprocess_wrapper import SubprocessWrapper


@when('the executable stdout is captured for "{args}"')
def step_impl(context, args):
    args = args.replace('{workdir}', context.workdir or '')
    wrapper = SubprocessWrapper(context.executable)
    wrapper.run(args)
    context.subprocess_wrapper = wrapper


@then('the captured process should complete with exit code {code:d}')
def step_impl(context, code):
    status = context.subprocess_wrapper.returncode
    assert status == code, 'unexpected exit status: {} (expected {}); stderr: {!r}'.format(
        status, code, context.subprocess_wrapper.stderr)


@then('the stdout should contain "{text}"')
def step_impl(context, text):
    text = text.replace('\\n', '\n')
    assert text in context.subprocess_wrapper.stdout, \
        'expected {!r} in stdout {!r}'.format(text, context.subprocess_wrapper.stdout)


@then("the stdout should contain '{text}'")
def step_impl(context, text):
    # Single-quoted variant so text containing literal double quotes (e.g. a
    # JSON snippet like "size": 5) can be matched without any escaping -
    # Gherkin's "{text}" argument doesn't interpret \" as an escaped quote.
    assert text in context.subprocess_wrapper.stdout, \
        'expected {!r} in stdout {!r}'.format(text, context.subprocess_wrapper.stdout)


@then('the stderr should contain "{text}"')
def step_impl(context, text):
    text = text.replace('\\n', '\n')
    assert text in context.subprocess_wrapper.stderr, \
        'expected {!r} in stderr {!r}'.format(text, context.subprocess_wrapper.stderr)
