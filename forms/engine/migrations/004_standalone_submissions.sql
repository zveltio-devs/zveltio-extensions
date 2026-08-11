-- O trimitere de formular de sine stătător nu vine de pe nicio pagină.
--
-- `zv_form_submissions` are doi creatori. `001_initial.sql` al engine-ului îl
-- face pentru page-builder, cu `page_id UUID NOT NULL REFERENCES zv_pages(id)`
-- și `section_id NOT NULL` — o trimitere e, acolo, o secțiune dintr-o pagină.
-- `001_forms.sql` al acestei extensii îl face cu `form_id`. Amândouă sunt
-- condiționate, iar migrațiile de core rulează la boot, înaintea oricărei
-- extensii — deci pe orice instalare nouă tabelul e al engine-ului.
--
-- Extensia inserează fără `page_id`, fiindcă nu are ce pune acolo. Rezultat
-- măsurat pe bază virgină: `POST /ext/forms/public/:slug/submit` răspunde 500 cu
-- `null value in column "page_id" violates not-null constraint`. Adică
-- funcționalitatea centrală — primirea unui formular completat — e moartă pe
-- fiecare instanță nouă.
--
-- Cineva a văzut jumătate din asta: `001_forms.sql` conține deja un
-- `ADD COLUMN IF NOT EXISTS form_id`, cu comentariul că tabelul poate fi creat
-- de core. S-a adăugat coloana care lipsea și nu s-a atins constrângerea care
-- respingea rândul.
--
-- Slăbirea lui NOT NULL, nu ștergerea coloanei: page-builder-ul scrie în
-- continuare `page_id` pentru trimiterile lui, iar cheia străină rămâne. Ce se
-- schimbă e că absența lui devine legală — ceea ce e adevărat pentru un formular
-- care nu stă pe nicio pagină.

ALTER TABLE zv_form_submissions ALTER COLUMN page_id    DROP NOT NULL;
ALTER TABLE zv_form_submissions ALTER COLUMN section_id DROP NOT NULL;

-- DOWN
-- Nu se pune la loc: rândurile scrise între timp de această extensie au
-- `page_id` NULL, iar repunerea constrângerii ar eșua pe ele. Un DOWN care nu
-- poate rula e mai rău decât unul care spune de ce.
