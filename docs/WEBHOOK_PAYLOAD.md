# Webhook Payload Specification

This structure must be populated as JSON into the TradingView 'Message' box configuration:

```json
{
  "alert_id":         "{{strategy.order.id}}",
  "symbol":           "{{ticker}}",
  "exchange":         "{{exchange}}",
  "interval":         "{{interval}}",
  "timestamp":        "{{timenow}}",
  "close":            {{close}},
  "action":           "buy",
  "order_type":       "market",
  "quantity":         1,
  "strategy":         "my_strategy_v1",
  "comment":          "{{strategy.order.comment}}",
  "secret":           "YOUR_WEBHOOK_SECRET_MATCHED_IN_ENV",
  "account_ids":      ["123456"]
}
```

The system requires `secret` mapping identically locally before generating processing. Idempotent constraints bounce duplicate `alert_id` executions across a 24-hr sliding window lock natively.
