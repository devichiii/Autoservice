# Telegram Bot

Python bot that communicates only through backend REST API.

## Responsibilities

- Notify clients about booking updates.
- Provide operational bot commands for reminders and status checks.
- Never access database directly.

## Security notes

- Use dedicated bot service token for API calls.
- Restrict bot endpoints by role/scope on backend.
- Log bot actions through backend audit log.
