# Tradovate Integrations

## Rate Limits
Tradovate restricts API traffic significantly (~100/min). We implement **BullMQ queueing** automatically backing off retry patterns to safely absorb rate limits across multi-account routing scenarios.

## WebSocket
We aggressively spawn one socket connection per registered account under DB parameters via `is_active` boolean matrices. 

## Tokens
Do not utilize OAuth flows for server backend automation. Connect uniquely mapped per-account API Keys using `auth/accesstokenrequest` endpoint securely. Node-cron maintains absolute TTL refresh 10 mins before expiry explicitly mapping standard connectivity uptime.
