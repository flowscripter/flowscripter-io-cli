import os
import shlex
import subprocess


class SubprocessWrapper:

    def __init__(self, executable):
        self.executable = executable
        self.stdout = None
        self.stderr = None
        self.returncode = None

    def run(self, args='', timeout=30):
        # shlex's default posix=True mode treats "\" as an escape character,
        # which mangles Windows paths (e.g. "C:\Users\...\Temp\...") by
        # stripping their separators. posix=False preserves them.
        tokens = shlex.split(args, posix=(os.name != 'nt')) if args else []
        cmd = [self.executable] + tokens
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, encoding='utf-8',
            errors='replace',
        )
        self.stdout = result.stdout
        self.stderr = result.stderr
        self.returncode = result.returncode
