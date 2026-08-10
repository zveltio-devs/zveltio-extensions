# Calitatea datelor — context

**Verificat prin apăsare: 2026-08-10, pe bază virgină.** Scanare rulată, probleme
găsite, prag SLA creat și re-creat, verificare SLA pe o scanare.

## Scorul a fost ELIMINAT — nu-l reintroduce fără să citești asta

Exista un scor, calculat cu:

```
(critice*10 + erori*5 + avertismente*2 + info*0.5) / înregistrări * 100
```

Măsurat: 4 avertismente pe 2 înregistrări → 400% penalizare → **scor 0**.
Aceleași 4 pe 100 de înregistrări → **92**. Numărul spunea mai mult despre
mărimea colecției decât despre calitatea datelor, iar nimeni nu putea explica ce
înseamnă un 78.

**Și nu se scria niciodată.** Scrierea era detașată, dormea două secunde
așteptând o scanare deja predată, și ateriza pe o tranzacție închisă — cu câte un
`catch` înăuntru și în afară. `zvd_quality_scores` era gol pe orice instalare care
a existat. De asta tabelul a putut fi șters în loc de migrat.

Punctajul configurabil trăiește acum în `workflow/checklists`, unde un om asertă
fiecare fapt și configurează ce înseamnă numărul.

## Ce a rămas, și e mai bun

SLA pe **numărători**: `max_critical_issues`, `max_error_issues`. Verificarea avea
deja `if (score && …)`, deci rula dintotdeauna doar pe astea. „Zero probleme
critice" e un prag pe care îl poate apăra oricine.

## Capcane

**Scanarea e asincronă.** `runQualityScan` întoarce id-ul imediat și continuă în
propria tranzacție. Nu încerca să afli când s-a terminat dormind — a fost
încercat, exact așa s-a pierdut scorul. Dacă ai nevoie de terminare, gazda
trebuie să anunțe.

`ON CONFLICT` pe pragurile SLA e `(tenant_id, collection)`, în forma de
constructor Kysely (`oc.columns([...])`) — nu în text. Un sweep care caută doar
`ON CONFLICT (` în SQL o ratează.
