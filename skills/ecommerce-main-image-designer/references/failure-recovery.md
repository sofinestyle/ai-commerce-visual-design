# Failure Recovery

## Text Model Filtering

When the requested text model is filtered or refuses:

1. Retry at most once with a smaller, safer copy-only request.
2. Preserve the commercial task and product facts.
3. Remove unnecessary sensitive descriptors.
4. Keep `response_format: json_object` where supported.
5. Do not downgrade to bland parameter-only copy.

If the retry still fails, use high-quality local fallback copy only when visible copy is allowed and needed, then clearly report the fallback.

## Copy Quality Failure

If all generated copy candidates score below the accepted threshold:

1. Retry at most once with a stricter copy-quality request.
2. If still weak, choose the highest-scoring candidate only when it is fact-safe and readable.
3. Mark the copy as needing review, or ask the user to confirm/edit copy before generation when quality risk is material.

## Image Provider Filter Recovery

When an image provider blocks scene wording:

1. Remove unnecessary age, body, or sensitive details.
2. Use neutral role wording when needed, such as:
   - student musician
   - young learner
   - student player
3. Preserve the intended ecommerce scene, product facts, and platform constraints.
4. Do not replace a blocked scene with unrelated product claims or generic product-only output unless the user agrees.

## Platform Chain Failure

If the unified platform chain fails:

1. Report the exact failure.
2. Stop unless the user approves retry or fallback.
3. Direct provider calls are allowed only when the user explicitly asks to bypass the platform chain, or when the platform chain is unavailable and the user confirms fallback.
4. If bypassing the platform chain, state before generating that the result may not appear in platform history or generation chain records.

## Image Retry Limits

Use the retry budget in `quality-review.md` for generated image QA failures. Do not continue automatic regeneration after the maximum attempts.
