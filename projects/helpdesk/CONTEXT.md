
## SDUI migration (2026-08-21)

Branch: `feat/sdui-helpdesk`

- Schema uses API fields **`title`** and message body **`content`** (not subject/body).
- Priority enum matches engine: `low|medium|high|critical` (not `urgent`).
- Status filters match engine: `open|in_progress|pending_customer|resolved|closed`.
- Reply is a row-action prompt posting `{ content }` to `/tickets/{id}/messages`.
- Tradeoff: no live conversation panel; list+create+resolve+reply prompt only.

