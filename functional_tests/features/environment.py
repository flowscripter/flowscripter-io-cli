import os
import shutil
import socket
import subprocess
import sys
import time


import boto3

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

    for plugin in ['@flowscripter/io-plugin-filesystem', '@flowscripter/io-plugin-s3']:
        result = subprocess.run(
            [executable, 'plugin:add', plugin],
            capture_output=True, text=True, timeout=120,
        )
        assert result.returncode == 0, \
            'failed to install {}: stdout={!r} stderr={!r}'.format(
                plugin, result.stdout, result.stderr)

    start_s3_server(context)


def after_all(context):
    server = getattr(context, 's3_server', None)
    if server:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()


def start_s3_server(context):
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]

    context.s3_server = subprocess.Popen(
        [sys.executable, '-m', 'moto.server', '--host', '127.0.0.1', '--port', str(port)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    context.s3_endpoint = 'http://127.0.0.1:{}'.format(port)

    deadline = time.time() + 60
    while time.time() < deadline:
        assert context.s3_server.poll() is None, 'moto server exited early'
        try:
            socket.create_connection(('127.0.0.1', port), timeout=1).close()
            break
        except OSError:
            time.sleep(0.2)
    else:
        raise AssertionError('moto server did not start listening on port {}'.format(port))

    context.s3_client = boto3.client(
        's3', endpoint_url=context.s3_endpoint, region_name='us-east-1',
        aws_access_key_id='test', aws_secret_access_key='test',
    )


def before_scenario(context, scenario):
    context.workdir = None
    context.s3_bucket = None


def after_scenario(context, scenario):
    if context.workdir and os.path.isdir(context.workdir):
        shutil.rmtree(context.workdir, ignore_errors=True)
