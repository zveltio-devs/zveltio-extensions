# Connecting to ANAF for e-Factura

This guide is for the Zveltio instance administrator. It takes about an hour, and
most of that is waiting on ANAF.

**You need none of this in order to issue invoices.** The invoice, the official
PDF and the check that the document is valid all work without any connection. You
only need ANAF in order to **submit** electronically.

---

## What you need before you start

**A qualified digital certificate**, from an authorised provider (certSIGN,
DigiSign, Trans Sped, Alfasign and others). It is the same certificate used to
sign tax declarations.

**SPV rights for the company** — legal representative, designated representative
or authorised agent. If you already file declarations for the company, you have
them.

If you are not yet in SPV:
<https://www.anaf.ro/InregPersFizicePublic/#tabs-2>

---

## Step 1 — Choose the callback address

This is the first decision and the easiest to get wrong, because it is **fixed at
registration** and is not comfortably changed afterwards.

The address is:

```
https://YOUR-DOMAIN/admin/anaf/callback
```

replacing `YOUR-DOMAIN` with the address you reach Zveltio at. It must be the
**public, exact** address, the same one you type into the browser. If you go to
`https://erp.company.ro`, that is the one; not `http://`, not the server's IP, not
`localhost`.

Write it down. You use it twice — once at ANAF, once in Zveltio — and **they must
be identical character for character**.

---

## Step 2 — Register the application with ANAF

Go to <https://www.anaf.ro/anaf/internet/ANAF/servicii_online/inreg_api> and
authenticate with the certificate.

Fill in the application registration form. For the callback, enter exactly the
address from Step 1.

You receive two values: **client ID** and **client secret**.

The secret is usually shown only once. Save it immediately, somewhere safe.

---

## Step 3 — Fill it in inside Zveltio

Open **ANAF Connection** from the menu.

| Field | What to enter |
|---|---|
| Environment | **Test** to begin with. Documents sent there have no fiscal effect. |
| Filer tax id | The tax id of the company you file for, without "RO". |
| Callback URL | Exactly the address from Step 1. |
| Client ID | What you received from ANAF. |
| Client secret | What you received from ANAF. |

Press **Save**.

The secret is never displayed again after saving — not even to you. It is
encrypted in the database. When you come back to the screen you only see that it
is set. If you leave it empty on a re-save, the previous one is kept; you type it
again only if you want to change it.

---

## Step 4 — Connect

Press **Connect to ANAF**. You are sent to their portal, where you sign with the
certificate — **which has to be physically attached to the computer you are
pressing from**, not to the server. Your browser makes the signature, not Zveltio.

After signing you are brought back and the connection is active.

---

## Step 5 — Check

Press **Test connection**. Zveltio calls ANAF's "Hello" service.

It is worth doing, and here is why: ANAF gives you a token if **you** have the
rights, but access to e-Factura also depends on whether the **application** was
enrolled for that service. The two fail just as badly and for completely different
reasons.

- **The test works, e-Factura does not** → good token, the application has no
  access to the service. Resolved at ANAF, not in Zveltio.
- **The test does not work either** → the problem is with the token: client ID,
  secret or callback.

---

## From here on

Every issued invoice automatically gets an e-Factura draft. You open it, generate
the XML, check it — the check is done by ANAF itself and costs nothing — and then
you submit it.

After submission you receive an **upload index**. Processing takes from seconds to
minutes. You query the state:

- **ok** — the invoice was validated and reached the buyer. You can download the
  receipt signed by the Ministry of Finance.
- **nok** — errors were found and **the invoice did NOT reach the buyer**. You
  download the response to see what they were.
- **in processing** — wait a little longer.

The difference between `ok` and `nok` is the one that matters. A `nok` invoice was
not submitted, however much it may look as though it was.

---

## When you move to production

Change **Environment** from Test to Production and save. The credentials stay.

From that moment every submission has fiscal effect.

---

## If something does not work

**"Set the ANAF client_id first"** — you have not saved the credentials yet.

**"Set the callback URL"** — you have not filled in the callback address.

**ANAF refuses the token request** — almost always the callback differs from the
registered one. Compare them character for character, including `https://` and any
trailing `/`.

**"The ANAF token has expired"** — press **Renew token**. If that does not work,
reconnect from Step 4.

**XML validation says `nok`** — the problem is in the invoice data, not the
connection. ANAF's messages name the missing field. The most frequent: the county
or the locality is missing for one of the parties, or the buyer's tax id. For
Bucharest, the locality has to be the sector.

---

## What Zveltio does not do

It does not hold your certificate. It stays with you; the server never sees it.

It does not submit on your behalf automatically. Every submission is an action you
take.

It cannot repair a wrong registration at ANAF. If the application is not enrolled
for e-Factura, that is resolved with them.
