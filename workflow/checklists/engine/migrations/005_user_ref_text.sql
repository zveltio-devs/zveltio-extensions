-- Two more user ids in uuid columns, and these two broke the main interaction.
--
-- `"user".id` is a 32-character nanoid. `checked_by` receives it every time
-- somebody ticks an item, and `completed_by` every time that tick finishes the
-- list, so both wrote a nanoid into a uuid and Postgres answered 22P02. Ticking
-- an item off has never worked on any installation — the one thing a checklist
-- is for.
--
-- Found by pressing the button rather than by reading: the template was created,
-- the checklist attached, its items copied, and then the first tick came back
-- 400 with a cast error the route never named.
--
-- These were missed by the earlier pass because that one worked from a
-- hand-written list of column names — `created_by`, `approved_by`, `changed_by`
-- and so on — and `checked_by` was simply not on it. The list was the wrong
-- instrument. The right question is asked of the catalogue: which uuid columns
-- are named `*_by`? That finds every one of them without anybody having to think
-- of the name first.

ALTER TABLE IF EXISTS zv_checklist_items ALTER COLUMN checked_by TYPE TEXT;
ALTER TABLE IF EXISTS zv_checklists ALTER COLUMN completed_by TYPE TEXT;
