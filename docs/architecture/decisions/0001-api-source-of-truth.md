# ADR 0001: AzaPay API is the source of truth

- Date: 2026-09-24
- Status: Accepted

## Context

The customer web application configures financial instructions and displays
their results. An invented balance, fee, schedule, or success state would mislead
a customer. The published
[AzaPay OpenAPI contract](https://azapay.onrender.com/openapi.json) provides the
supported operations and response shapes.

## Decision

The AzaPay backend defines supported actions and owns financial state. The
frontend uses the API contract for behaviour and data shapes. Backend-provided
balances, fees, schedules, readiness, and settlement states are displayed
without locally simulating financial outcomes.

## Consequences

- A request acknowledgement is shown as pending until the API reports the
  appropriate confirmed state.
- The UI offers actions supported by documented endpoints and resource rules.
- Contract changes require a review of the affected module and user journey.

## Review trigger

Review when the backend publishes a new contract version or explicitly changes
a product rule.
