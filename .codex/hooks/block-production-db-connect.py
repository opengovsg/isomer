#!/usr/bin/env python3
"""Block repository commands that can open a production database tunnel."""

import json
import os
import shlex
import sys


DENIAL_REASON = (
    "Blocked by repository policy: do not run pnpm db:connect or invoke "
    "connectRds.sh. Production database access requires the developer to "
    "perform the connection outside the agent session."
)
SHELL_SEPARATORS = {"&", "&&", ";", "|", "||"}


def shell_tokens(command: str) -> list[str]:
    lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|")
    lexer.whitespace_split = True
    lexer.commenters = ""
    return list(lexer)


def is_production_database_command(command: str) -> bool:
    try:
        tokens = shell_tokens(command)
    except ValueError:
        # A malformed shell command cannot execute successfully, but fail closed
        # if it still contains one of the protected entry points.
        return "db:connect" in command or "connectRds.sh" in command

    for index, token in enumerate(tokens):
        executable = os.path.basename(token).lower()

        # Block direct invocation of the tunnel script regardless of its
        # arguments so an environment variable cannot conceal the `prod` value.
        if executable == "connectrds.sh":
            return True

        if executable not in {"pnpm", "pnpm.cmd", "pnpm.exe"}:
            continue

        # pnpm permits flags and `run` before a package script, so inspect the
        # remainder of the current shell segment for the exact protected script.
        for argument in tokens[index + 1 :]:
            if argument in SHELL_SEPARATORS:
                break
            if argument == "db:connect":
                return True

    return False


def main() -> int:
    try:
        hook_input = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return 0

    tool_input = hook_input.get("tool_input") or {}
    command = tool_input.get("command") or tool_input.get("cmd") or ""
    if not isinstance(command, str) or not is_production_database_command(command):
        return 0

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": DENIAL_REASON,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
