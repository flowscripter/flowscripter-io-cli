import shlex
import subprocess


class SubprocessWrapper:

    def __init__(self, executable):
        self.executable = executable
        self.stdout = None
        self.stderr = None
        self.returncode = None

    def run(self, args='', timeout=30):
        cmd = [self.executable] + (shlex.split(args) if args else [])
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, encoding='utf-8',
            errors='replace',
        )
        self.stdout = result.stdout
        self.stderr = result.stderr
        self.returncode = result.returncode
