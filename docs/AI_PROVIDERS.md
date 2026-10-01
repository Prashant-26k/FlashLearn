# AI provider notes

Last verified: 2026-09-22. Provider quotas change by account, model, billing tier, and
region. The values below are guidance for this deployment, not a promise of provider
capacity. The application has its own lower MongoDB-backed limits so it does not attempt
to use provider free tiers as an unlimited pool.

## Google Gemini

- **Adapter/model:** `@google/generative-ai`, default `gemini-2.5-flash`; override with
  `GEMINI_MODEL`. Google’s model catalog lists Gemini 2.5 Flash as a low-latency,
  high-volume model with a 1M-token context window.
- **Limits:** Gemini documents RPM, input TPM, and RPD limits per Google Cloud project,
  with exact values visible in AI Studio and varying by model and usage tier. Free-tier
  quotas are not guaranteed and reset RPD at midnight Pacific time; this is why FlashLearn
  does not hard-code a provider quota.
- **Structured output:** JSON MIME type and JSON Schema structured output are supported.
  We still validate with Zod because provider-conforming JSON can contain unusable cards.
- **Latency/retry:** Flash is the preferred low-latency model. 429, 408, 5xx, and
  network timeouts are retried with jitter and cooldown; credentials and malformed
  requests are not retried.
- **Data/privacy:** Google AI Studio free-tier content may be used to improve Google
  products according to its current terms. Do not use this configuration for data that
  requires an enterprise no-training commitment without changing the account/tier.
- **Commercial use:** Check the current Gemini API and Google Cloud terms for the
  selected account/model; free access is not an unlimited production entitlement.

Sources: [Gemini models](https://ai.google.dev/gemini-api/docs/models),
[rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), and
[structured output](https://ai.google.dev/gemini-api/docs/structured-output).

## Groq

- **Adapter/model:** OpenAI-compatible HTTPS API, default `openai/gpt-oss-120b`;
  override with `GROQ_MODEL`.
- **Models:** Groq’s hosted model catalog is account-dependent and includes production
  and preview models. Preview models can be removed at short notice. Model context
  windows and availability must be checked against the live catalog before changing the
  default.
- **Limits:** Groq measures organization-level RPM, RPD, TPM, TPD, and, for some
  organizations, separate input/output TPM. Exact limits are shown on the organization
  Limits page, and response headers expose remaining/reset values. There is no safe
  universal RPM/RPD number to embed here.
- **Structured output:** The adapter requests OpenAI-compatible JSON mode and validates
  the returned object. Compatibility can vary by model, so an invalid/unsupported
  response is treated as a provider failure and may fall back.
- **Latency/retry:** Groq is generally low latency; honor `retry-after` on 429 and use
  exponential backoff for transient errors.
- **Data/privacy and commercial use:** Review Groq’s current privacy policy, service
  terms, and organization plan before sending sensitive documents. Free access is
  rate-limited, not a license to evade quotas; FlashLearn uses one server-side key.

Sources: [Groq rate limits](https://console.groq.com/docs/rate-limits) and
[Groq model catalog](https://console.groq.com/docs/models).

## OpenRouter

- **Adapter/model:** OpenAI-compatible HTTPS API at `https://openrouter.ai/api/v1`,
  default `openrouter/free`; override with `OPENROUTER_MODEL`. OpenRouter selects an
  eligible free model for the router model, so the selected upstream model can change.
- **Limits:** OpenRouter limits depend on account status and the selected upstream
  model. Free models are rate-limited and can be temporarily unavailable; the
  application treats 429 as a real provider limit and does not rotate keys.
- **Structured output:** The adapter requests JSON mode and FlashLearn validates the
  canonical schema locally. Support depends on the selected upstream free model.
- **Latency/retry:** Routing adds variability. Retry-after, exponential backoff, and
  provider cooldowns are used for transient failures.
- **Data/privacy and commercial use:** OpenRouter routes prompts to third-party model
  providers. Review OpenRouter’s privacy policy, model-provider data policies, and
  each model’s license before sending sensitive documents. Free availability is not a
  promise of permanent capacity or unrestricted commercial use.

Sources: [OpenRouter models](https://openrouter.ai/models),
[free models](https://openrouter.ai/collections/free-models),
[API overview](https://openrouter.ai/docs/api-reference/overview), and
[privacy](https://openrouter.ai/privacy).

## FlashLearn routing policy

The order is configured by `AI_PROVIDER_ORDER` and defaults to Gemini, Groq, then
OpenRouter. The orchestrator filters missing credentials and cooling-down providers,
then scores configured priority plus recent failures and latency. A provider failure
does not expose provider names to end users. Each attempt is recorded in `AIRequest`;
request bodies, keys, headers, and document text are never stored.

Per-generation user quota is counted once when a request begins. Provider-call quota
counts every actual attempt, including retries and fallbacks. The latter distinction
prevents a bug in chunk processing from exhausting a provider silently.

Usage buckets use the UTC calendar date (`YYYY-MM-DD`) and are indexed by
`userId + date`; there is no midnight reset job. A request that starts just before a
UTC boundary belongs to the earlier bucket, and a request after the boundary belongs
to the new bucket. MongoDB atomic conditional increments enforce the configured limits
across restarts and multiple backend instances.
