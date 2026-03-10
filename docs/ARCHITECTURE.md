# Architecture

The system executes a strictly sequential logic framework, intercepting fast HTTP spikes into a reliable queue.

## Worker Queue Responsibilities

- **Job**: `ProcessTradovateOrder`
- Priority 1: High severity mitigations (`close_position` true). Skips limits to immediately exit risk over Market executions mapping.
- Priority 2: Standard Trade execution.

Wait for standard REST response. If bracket required (Noted in TV Comment or explicit inputs), the WebSocket listener will pick up the `"Filled"` flag locally parsed and generate an OSO API hit natively passing `{ TP: X, SL: Y }`.

## The `isAutomated` Flag Constraint
Tradovate strict logic blocks server orders without `{ isAutomated: true }` natively parsed against the REST hit. We apply this aggressively in the `TradovateOrderService`.
