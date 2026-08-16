import os
import shutil
import subprocess
import sys

IS_WINDOWS = sys.platform.startswith('win')

if IS_WINDOWS:
    # Windows' legacy console codepage cannot encode every Unicode icon used in
    # flowscripter-io-cli's colored output, crashing behave's pretty formatter with
    # UnicodeEncodeError whenever a failure message contains one.
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


def before_all(context):
    context.config.setup_logging()

    executable = os.environ.get('EXECUTABLE')
    assert executable, 'EXECUTABLE environment variable must be set'
    context.executable = executable

    # Fresh plugin store for every run, so a previous local run's state can't
    # mask a real failure here.
    plugins_dir = os.path.expanduser(os.path.join('~', '.flowscripter-io-cli'))
    if os.path.isdir(plugins_dir):
        shutil.rmtree(plugins_dir)

    result = subprocess.run(
        [executable, 'plugin:add', '@flowscripter/io-plugin-filesystem'],
        capture_output=True, text=True, timeout=120,
    )
    assert result.returncode == 0, \
        'failed to install io-plugin-filesystem: stdout={!r} stderr={!r}'.format(
            result.stdout, result.stderr)


def before_scenario(context, scenario):
    context.workdir = None


def after_scenario(context, scenario):
    if context.workdir and os.path.isdir(context.workdir):
        shutil.rmtree(context.workdir, ignore_errors=True)
