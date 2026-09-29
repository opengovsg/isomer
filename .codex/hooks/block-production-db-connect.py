#!/usr/bin/env python3
"""Block repository commands that can open a production database tunnel.

This is a speed bump against an agent invoking the tunnel by mistake, not a
sandbox. It matches on command text, so it cannot see through an encoded or
indirectly constructed command; the real gate is that connectRds.sh needs an
interactive AWS SSO login.
"""

import json
import sys


DENIAL_REASON = (
    "Blocked by repository policy: do not run pnpm db:connect or invoke "
    "connectRds.sh. Production database access requires the developer to "
    "perform the connection outside the agent session."
)
PROTECTED = ("db:connect", "connectrds.sh")
NON_PRODUCTION_ENVIRONMENTS = ("staging", "uat", "vapt")


def is_production_database_command(command: str) -> bool:
    command = command.lower()

    # The non-production variants contain the protected names as a prefix
    # (`db:connect:staging`), so remove them before looking for a bare match.
    for environment in NON_PRODUCTION_ENVIRONMENTS:
        command = command.replace(f"db:connect:{environment}", "")
        command = command.replace(f"connectrds.sh {environment}", "")

    return any(name in command for name in PROTECTED)


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
