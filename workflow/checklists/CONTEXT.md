# Checklists — context

**Verified by pressing: 2026-08-10, on a virgin database.** Template created,
attached to a record, items copied, ticked, list completed, two scoring schemes
configured and scores computed.

## What was broken

**Ticking an item never worked.** `checked_by` and `completed_by` are `uuid`
columns receiving `"user".id` — a 32-character nanoid. Every attempt to tick
returned 400 with a conversion error the route did not name. On every installation
that ever existed, for **the extension's central action**.

Worth remembering how it escaped: **two passes on the same day were looking for
exactly this class** and missed it, because they worked from a hand-written list
of column names, and `checked_by` was not on it. The engine now has a gate that
asks the catalogue — *which `uuid` columns are named `\*_by`?* — instead of a list
someone has to keep complete.

## Configurable scoring

A template carries any number of **schemes**. Weights live on the scheme, not on
the item — that is the whole point: an inspection can be measured simultaneously
for safety and for commercial compliance, and the item that matters enormously to
one can be irrelevant to the other. A zero weight, or its absence, removes the
item from that scheme's denominator.

**Weights bind to the item in the TEMPLATE**, which required
`zv_checklist_items.template_item_id`. An instance's items are copies, and the
only link to the original was the label — scoring by label would have come apart
at the first corrected typo. Silently, and in the direction that flatters the
score.

**The result keeps a snapshot** of what produced it: every weighted item, its
weight, whether it was ticked, the threshold in force. Weights change; last year's
audit must not.

**It recomputes on every change**, not on completion. Completion fires when the
last *required* item is ticked, and the optional ones usually come after — so
computing on the transition froze the score at 5/10 while two later ticks no
longer moved it. Measured live after the repair: 50 → 70 → 100.

## A model limit — read before extending the scoring

**Ticked does not mean compliant.** "The temperature is wrong" and "I did not
check the temperature" look identical: an unticked item. A real inspection needs
three states — compliant, non-compliant, not applicable. For now there are two.

It was not changed because it is a model decision, not a defect. But with the
score on screen the difference becomes visible.

## Still open

**The studio page is dead end to end.** It calls four addresses, all 404: `/`,
`/{id}`, `/{id}/responses`. It has a `responses` state and a `'responses'` view —
it is a copy of the **forms** page, where that shape makes sense. The real API is
`/templates`, `/record/:collection/:id`, `/items/:id`, `/overdue-items`,
`/summary`.

The scheme configuration screen needs **master-detail** (scheme → weights per
item), which the renderer does not have yet. The third thing waiting on it.

## SDUI migration (2026-08-21)

SDUI templates+summary; GET /templates?all=1 embeds items
Branch: `feat/sdui-crud-batch`
