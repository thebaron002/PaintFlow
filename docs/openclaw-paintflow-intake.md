# PaintFlow OpenClaw Intake

This integration lets the Discord `Jobs` channel feed PaintFlow directly from document photos.

Phase 1 uses a dedicated `paintflow` agent plus local OCR. It does not send images to an external vision provider and it does not introduce a separate fuel document type.

## Agent and channel routing
- Discord channel: `1480776811481661613`
- Dedicated agent: `paintflow`
- Required local skills:
  - `paintflow-intake`

The OCR step is bundled inside `paintflow-intake` for the live channel path. This avoids a separate skill-resolution dependency in the runtime session.

After changing the binding or skill stack, reset the old channel session so the stale `chat` snapshot is not reused.

## Phase 1 operating rules
- Read the local inbound image path from the Discord message.
- Run local OCR before building any intake payload when the message contains `[media attached: ...]`.
- Use only the current image, the current caption/message, and the current hint for extraction.
- Do not backfill customers, addresses, quotes, totals, or descriptions from prior session context.
- POST only when the current OCR candidate plus current message provide every endpoint-required field.
- If OCR is weak or a required field is missing, ask a short specific follow-up instead of guessing.
- Fuel stays inside the `receipt` flow and requires confirmation before POST.

## Supported documents

### `work_order`
Creates a new job.

Extract when visible:
- `customer`
- `quote`
- `address`
- `amount`
- `startDate`

Required before POST:
- `customer`
- `address`
- `amount`
- `startDate`

Rules:
- prefer a handwritten or explicitly scheduled start date when it clearly represents the real start date
- do not invent totals from room notes, line items, or partial subtotals
- do not invent customer names, addresses, quotes, or descriptions from prior context
- if the front does not show the total amount, ask for the back side or typed amount first
- `quote` is helpful but optional at the endpoint level

### `check`
Finalizes one or more related existing jobs. It does not create standalone income.

Extract when visible:
- `amount`
- `date`
- `payer`
- `checkNumber`
- `memo`
- `jobs`

Required before POST:
- `amount`
- `date`
- at least one `jobs` entry containing `quote` or `customer`

Rules:
- exact `quote` match first
- `customer` fallback second
- do not use `payer` as the primary matcher
- only use a quote or customer that appears in the current image/caption/hint
- allow the current caption or hint to supply `job #10441` or a visible customer name
- if no related job reference is available, ask a short follow-up before sending anything

### `receipt`
Creates a general expense.

Extract when visible:
- `amount`
- `date`
- `vendor`
- `category`
- `description`

Required before POST:
- `amount`
- `date`

Rules:
- a gas pump photo or gas receipt is still a `receipt`
- fuel remains inside the `receipt` flow in phase 1
- require confirmation before POST when the image is a gas pump or fuel receipt
- do not create a new fuel document type

## OCR handoff
1. Read the local inbound image path from the Discord message.
2. Run the bundled local OCR script from `paintflow-intake` with the local image plus nearby caption/context as `--hint` when helpful.
3. Review the structured OCR candidate:
   - `docTypeCandidate`
   - `fields`
   - `needsFollowUp`
   - `followUpReason`
4. If the OCR candidate still lacks required fields, ask the shortest useful follow-up.
5. If the OCR candidate is fuel-related, ask for confirmation before POST.
6. Build the intake payload only after the rules above are satisfied.
7. POST to `PAINTFLOW_INTAKE_URL`, which must point at the active PaintFlow backend route `/api/openclaw/intake`.

## Recommended follow-up reasons
- `missing_total`
- `missing_job_ref`
- `fuel_confirmation`
- `ocr_failed`
- `doc_unclear`

Example follow-ups:
- `I found a work order, but the total is not visible. Send the back side or type the total amount.`
- `I found the check, but I still need the quote number or customer name for the related job.`
- `I found a fuel receipt. Confirm if you want me to post it as a receipt expense.`

## Operational examples

### Work order with no visible total
- OCR classifies the image as `work_order`
- `customer`, `address`, and `startDate` are present
- `amount` is missing
- Result: do not POST; ask for the back side or typed total

### Check with caption `job #10441`
- OCR classifies the image as `check`
- OCR extracts `amount`, `date`, and `checkNumber`
- the caption supplies the related job reference `job #10441`
- Result: build `jobs: [{ "quote": "10441" }]` and POST

### Gas pump photo
- OCR classifies the image as `receipt`
- OCR flags `fuelCandidate=true`
- amount and date may already be present
- Result: do not POST yet; ask for confirmation first

## Recommended deploy order
1. Deploy PaintFlow with the intake route present at `/api/openclaw/intake` and the intake secret configured on the backend.
2. Set `PAINTFLOW_INTAKE_URL` in OpenClaw to the active backend base URL plus `/api/openclaw/intake`.
3. Do not rely on the old hardcoded `studio--studio-170657449-62ce2.us-central1.hosted.app` fallback. If the App Hosting backend is recreated or the serving URL changes, update `PAINTFLOW_INTAKE_URL` explicitly.
4. Reload OpenClaw after binding the dedicated `paintflow` agent.
5. Reset the old channel session.
6. Test with one work order, one check, and one fuel receipt.
