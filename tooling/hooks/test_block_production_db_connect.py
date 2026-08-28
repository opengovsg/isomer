#!/usr/bin/env python3
"""Self-check for the production database guard. Run: python3 <this file>"""

import importlib.util
import pathlib


HOOK = pathlib.Path(__file__).with_name("block-production-db-connect.py")
spec = importlib.util.spec_from_file_location("hook", HOOK)
hook = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hook)

BLOCKED = [
    "pnpm db:connect",
    "pnpm run db:connect",
    "npm run db:connect",
    # Wrapping the command in a shell hides it from token-based matching.
    "sh -c 'pnpm db:connect'",
    'bash -lc "pnpm db:connect"',
    "S=db:connect; pnpm $S",
    "ls && pnpm db:connect",
    "apps/studio/scripts/connectRds.sh prod",
    "bash ./scripts/connectRds.sh prod",
    "pnpm --filter isomer-studio exec bash scripts/connectRds.sh prod",
    "PNPM RUN DB:CONNECT",
]

ALLOWED = [
    "pnpm run setup",
    "pnpm db:seed",
    "pnpm build",
    "git status",
    "pnpm db:connect:staging",
    "pnpm db:connect:uat",
    "bash ./scripts/connectRds.sh staging",
    "bash ./scripts/connectRds.sh vapt",
]

for command in BLOCKED:
    assert hook.is_production_database_command(command), f"should block: {command}"

for command in ALLOWED:
    assert not hook.is_production_database_command(command), f"should allow: {command}"

print(f"ok: {len(BLOCKED)} blocked, {len(ALLOWED)} allowed")
