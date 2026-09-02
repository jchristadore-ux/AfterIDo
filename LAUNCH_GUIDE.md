# Launching AfterIDo

Written for someone who is not a developer. No command line, no code. Every
step is a website you log into and a form you fill in.

Read it once end to end before you start — it will make more sense than doing
it a step at a time.

---

## Already done

| | |
|---|---|
| Domain | **after-i-do.com** ✅ purchased |
| Cloudflare account | ✅ `ff4b01fbc362a9e794842a52c0ce2996` |
| D1 database | ✅ `after-i-do`, id in `wrangler.jsonc` |
| `CLOUDFLARE_API_TOKEN` | ✅ in GitHub |

Steps 1–3 below are done. What's left is **Stripe** (step 4, and note the Price
vs Product id warning) and **email** (step 5).

---

## What you have right now

Two versions of AfterIDo exist, and it helps to keep them straight:

| | The preview | The real site |
|---|---|---|
| Where | github.io (already live) | Cloudflare |
| Address | `jchristadore-ux.github.io/AfterIDo/` | **after-i-do.com** |
| Free features | Work | Work |
| Accounts | No | Yes |
| Can take payment | **No** | **Yes** |

The preview is honest about this. It doesn't show a broken "Buy" button — the
Premium page says plainly that it isn't connected to a payment processor.

**Nothing here is optional if you want to charge money.** A site that only
serves files — which is what the preview is — has nowhere to verify a payment.

---

## What it costs

| | Monthly | Yearly |
|---|---|---|
| Cloudflare Workers (hosting + API) | **$0** | $0 |
| Cloudflare D1 (database) | **$0** | $0 |
| Accounts / sign-in (built in) | **$0** | $0 |
| Analytics (built in) | **$0** | $0 |
| Resend (email) | **$0** | $0 |
| Stripe | **$0** | $0 |
| after-i-do.com | — | ~$10 |
| **Total** | **$0/month** | **~$10/year** |

Stripe takes 2.9% + 30¢ per sale. On $19.99 that's about $0.88, so you keep
about **$19.11**.

**When would this stop being free?** Workers: 100,000 requests/day — roughly
15,000–20,000 visitors. Then $5/month. Resend: 3,000 emails/month. Then $20.
D1: far more than this app will ever use. If you cross any of these you're
making far more than $5.

---

## Step 1 — The database

**Time: 5 minutes.**

> **This is the step my earlier draft got wrong.** D1 is **not** under Workers &
> Pages. It's further down the left sidebar in its own section called
> **Storage & Databases** — you may need to scroll past Compute to see it.

The direct link, which skips the hunting:

**https://dash.cloudflare.com/ff4b01fbc362a9e794842a52c0ce2996/workers/d1**

1. Click **Create** (or "Create database").
2. Name it whatever you like — `after-i-do` is what you used. Just make sure
   `database_name` in `wrangler.jsonc` says the same thing.

   (The deploy itself refers to the database by its *binding*, `DB`, so a
   rename in the dashboard can't break it.)
3. Leave the location on Automatic. Click Create.
4. On the database's page, copy the **Database ID** — a long string of letters,
   numbers and hyphens.

If the sidebar section is called something slightly different, the link above
still works — Cloudflare renames dashboard sections from time to time, and D1
itself is stable.

---

## Step 2 — Put the database ID in the code

**Time: 2 minutes.**

In your GitHub repository, open `wrangler.jsonc` (click the file, then the
pencil icon). Find:

```jsonc
"database_id": "REPLACE_WITH_YOUR_D1_DATABASE_ID",
```

Replace it with the ID from step 1, keeping the quotes. Commit.

Your account ID and domain are already filled in — you don't need to touch
those.

---

## Step 3 — The Cloudflare API token

**Time: 5 minutes.** One secret, not two — the account ID isn't secret and is
already in the config.

1. Go to **My Profile → API Tokens → Create Token**
   (https://dash.cloudflare.com/profile/api-tokens)
2. Use the **Edit Cloudflare Workers** template.
3. **Add D1 to it — the template does not include D1.** Under "Permissions",
   click **+ Add more** and set a row to **Account** · **D1** · **Edit**.

   > **This is the second step my earlier draft got wrong.** Without it the
   > token works perfectly for everything except the database, so the deploy
   > authenticates, prints your account, and then dies on the migration step
   > with `The given account is not valid or is not authorized to access this
   > service [code: 7403]` — which sounds like a broken account and is
   > actually a missing checkbox.

4. Under "Account Resources" make sure your account is selected; under "Zone
   Resources" select **after-i-do.com** (or All zones).
5. Create it and **copy the token — Cloudflare only shows it once.**

Already created a token without D1? You do not need a new one — open it from
the same API Tokens page, hit **Edit**, add the D1 row, and save. The token
value does not change, so the GitHub secret stays as it is.

Then in GitHub: **Settings → Secrets and variables → Actions → New repository
secret**

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token you just copied |

Until this exists, the deploy workflow skips itself, so nothing is broken while
you're partway through.

**Once you add it and merge, your site deploys to after-i-do.com.** Accounts
work. Payments don't yet — that's next.

### Do not connect Cloudflare's own "Workers Builds"

While you are in the Cloudflare dashboard you will be offered a **Build**
setting that connects this GitHub repository directly, so Cloudflare builds and
deploys the Worker itself on every push. **Decline it.** GitHub Actions is
already doing that job, from the workflow above, where the configuration is in
version control and reviewable.

Connecting both is worse than picking either one:

- **It skips your migrations.** The workflow deliberately runs
  `d1 migrations apply` *before* `wrangler deploy`, so the schema is never
  behind the code that queries it. Workers Builds only deploys. It can put code
  live against a database that does not have the column it is about to read.
- **Two deploys race.** Both fire on the same push, at the same Worker, in no
  fixed order.
- **It fails silently.** It reports a red X to GitHub with an empty log body —
  the reason stays in the Cloudflare dashboard, so the pull request just shows
  a failure with nothing to read.

If it is already connected, remove it: **Workers & Pages → afterido →
Settings → Build → Disconnect**. Cloudflare also leaves behind an API token
named `Workers Builds - <date>`; once disconnected, that token can be deleted
from https://dash.cloudflare.com/profile/api-tokens.

---

## Step 4 — Stripe, in test mode

**Time: 20 minutes.** Test mode first. You cannot take real money until step 7,
and that's deliberate.

1. Create an account at **stripe.com**.

2. **Test mode** toggle at the top right must be **on**.

3. **Product catalogue → Add product**:
   - Name: `AfterIDo Premium`
   - Price: `19.99` USD
   - **One time** ← this matters. Not recurring.
   - Save, then copy the **Price ID** (starts with `price_`).

4. **Developers → API keys** → copy the **Secret key** (`sk_test_...`).

5. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://after-i-do.com/api/stripe/webhook`
   - Events — select these four:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `charge.refunded`
     - `charge.dispute.closed`
   - Save, then copy the **Signing secret** (`whsec_...`).

**What the webhook is for:** it's how Stripe tells your site a payment
succeeded. Everything about who gets Premium depends on it. Without it, people
pay and get nothing.

---

## Step 5 — Resend, for email

**Time: 10 minutes.** You can skip this and come back — sign-in links just
won't send until you do.

1. Create an account at **resend.com**.
2. **Domains → Add Domain** → `after-i-do.com`. Since the domain is on
   Cloudflare, Resend can usually add the DNS records for you; otherwise copy
   them into Cloudflare's **DNS** section.
3. **API Keys → Create API Key** → copy it (`re_...`).

The from-address is already set to `AfterIDo <hello@after-i-do.com>`, which
works once the domain verifies. You don't need a real inbox at that address —
it only sends.

---

## Step 6 — The four secrets

**Time: 10 minutes.** These go into **Cloudflare**, not GitHub — they're what
your live site uses.

**Workers & Pages → afterido → Settings → Variables and Secrets.** For each,
click Add, choose **Secret** (not Text), and paste.

(The *Worker* is named `afterido`. That's a different thing from the database,
which you named `after-i-do` — both are fine, they just aren't the same object.)

| Name | Value | From |
|---|---|---|
| `SESSION_SECRET` | a long random string — see below | you make it up |
| `STRIPE_SECRET_KEY` | `sk_test_...` | step 4.4 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | step 4.5 |
| `RESEND_API_KEY` | `re_...` | step 5.3 |

**For `SESSION_SECRET`**: open a new browser tab, press F12, click Console,
paste this and press Enter:

```js
crypto.randomUUID() + crypto.randomUUID()
```

Copy the result without the quotes. At least 32 characters. **Never share it** —
it's what keeps other people out of your customers' accounts.

Then back in GitHub, edit `wrangler.jsonc` once more and fill in two things:

```jsonc
"STRIPE_PRICE_ID": "price_...",     ← from step 4.3
"SUPPORT_EMAIL": "you@gmail.com",   ← see below
```

**About `SUPPORT_EMAIL`:** it's shown publicly on the Contact page and in the
Terms and Privacy Policy. It's where real customers write about refunds. A
Gmail address is fine, but pick it deliberately — until you set it, the Contact
page honestly says no address is configured rather than inventing one.

Commit. **Your site is now live and can take test payments.**

---

## Step 7 — Test before you take real money

**Time: 15 minutes. Do not skip this.**

On your phone, go to **after-i-do.com** and do the whole thing as a customer:

- [ ] Landing page loads and looks right
- [ ] "Start My Name Change" walks through the questions
- [ ] At the end it offers to save your plan — enter your email
- [ ] **The sign-in email arrives.** Check spam. Click the link.
- [ ] You land back in your plan, signed in
- [ ] Pricing page says **"Stripe is in test mode — no real charge will be made."**
- [ ] Click "Unlock Premium" — you're sent to Stripe's page
- [ ] Pay with **4242 4242 4242 4242**, any future expiry, any 3-digit code, any postcode
- [ ] You come back and Premium unlocks within a few seconds
- [ ] The Letters page shows real letters with your name in them
- [ ] **The receipt email arrives**
- [ ] Sign out, sign in again — Premium is still there

Now test that failure works properly:

- [ ] Sign out, open Pricing — it asks you to make an account first, rather than
      offering a broken button
- [ ] Start checkout and press **back** on Stripe's page instead of paying. You
      return with "your payment was cancelled" and **Premium stays locked.**

**If Premium ever unlocks without a payment, stop and do not go live.**

### Going live

1. In Stripe, switch **Test mode** off.
2. Complete Stripe's account activation — bank details, your legal information.
   Stripe won't release money until this is done.
3. **Redo steps 4.3, 4.4 and 4.5 in live mode.** Live and test are separate
   worlds; nothing carries over, including the webhook.
4. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Cloudflare, and
   `STRIPE_PRICE_ID` in `wrangler.jsonc`.
5. **Buy it yourself with a real card. Then refund yourself** from the Stripe
   dashboard and check Premium switches off — that proves refunds work before a
   stranger needs one.

---

## Step 8 — Before you tell anyone

**Legal.** Open `src/config/site.ts` and check three things:

```ts
legalEntity: 'AfterIDo',
```
If you've registered a company, its registered name. Trading as yourself? Your
own name. This is who the customer is contracting with.

```ts
governingLaw: 'the State of New Jersey, United States',
```
Where you actually live or are incorporated — not where your customers are.

```ts
refundWindowDays: 30,
```
The window the Terms promise. Honour it.

Then read `/privacy`, `/terms` and `/disclaimer` on your own site. They describe
what the app actually does, so they're accurate today — but they're your
promises now. **If you're taking money from the public, having a lawyer read
them once is money well spent.** This guide is not legal advice.

**Search engines.**

1. **search.google.com/search-console** → add `after-i-do.com`
2. Submit the sitemap: `https://after-i-do.com/sitemap.xml`
3. A few weeks to show up in results. That's normal.

**Check the link preview.** Text yourself the link. You should see the
pink-and-white AfterIDo card, not a blank box.

**Optional: www.** The Worker is bound to the bare `after-i-do.com`. If you want
`www.after-i-do.com` to work too, add a redirect in Cloudflare: **Rules → Redirect
Rules → Create**, matching hostname `www.after-i-do.com` and redirecting to
`https://after-i-do.com` with a 301.

---

## How you'll know if it's working

Everything is already counted — no extra service, no tracking pixel, no cost.
Go to your D1 database → **Console** and paste:

```sql
SELECT day, name, COUNT(*) AS n
FROM events
WHERE day >= date('now', '-14 days')
GROUP BY day, name
ORDER BY day DESC, n DESC;
```

The number that matters most:

```sql
SELECT
  SUM(name = 'landing_viewed')       AS visitors,
  SUM(name = 'onboarding_completed') AS finished_setup,
  SUM(name = 'purchase_completed')   AS bought
FROM events
WHERE day >= date('now', '-30 days');
```

Lots finish onboarding but nobody buys → the price or the Premium pitch is
wrong. Nobody finishes onboarding → the questions are too long, or the landing
page promises the wrong thing.

**These counts cannot tell you who anyone is.** No user ID, no IP address, no
cookie — deliberately. You see what's working; your customers don't get tracked.

---

## Things that will come up

**"Someone says they paid but doesn't have Premium."**
Look them up in Stripe by email. If the payment succeeded, check **Developers →
Webhooks** and click your endpoint for failed deliveries — Stripe retries for up
to three days. You can also ask them to revisit `/premium/success`, or refund.

**"I want to give someone Premium for free."**
D1 → your database → Console:
```sql
UPDATE users SET plan = 'premium', plan_granted_at = unixepoch()
WHERE email = 'them@example.com';
```
They must have signed in once first, or there's no row to update.

**"Someone wants their data deleted."**
They can do it themselves: Profile → Delete my account. Or:
```sql
DELETE FROM users WHERE email = 'them@example.com';
```
Their purchase record stays, with their email detached — deliberate, because you
need financial records and those contain nothing identifying.

**"I want to change the price."**
Make a *new* Price in Stripe (don't edit the old one — existing records point at
it), then update `STRIPE_PRICE_ID` and `PRICE_LABEL` in `wrangler.jsonc`. People
who already bought keep what they bought.

**"A government link is broken."**
`src/data/tasks.ts` holds every task and link; `src/data/states.ts` holds
state-specific guidance. Plain lists — edit, commit, live in about two minutes.
Update the `lastReviewed` date when you check a state.

**"I want proper detail for another state."**
`src/data/states.ts` — copy the New Jersey block, change the details, add it to
`STATE_GUIDANCE`. Until then that state's page honestly says you haven't
verified the local specifics and links to the official agency. That's better
than guessing, and it's why the app covers all fifty states without making
anything up.

---

## What to do if something breaks

**Site is down.** Workers & Pages → afterido → **Logs**.

**A deploy failed.** GitHub → **Actions** → click the red run. The failed step
is expanded and the error is usually the last few lines.

**"Couldn't find a D1 DB with the name or binding …" in the deploy log.** The
`database_id` in `wrangler.jsonc` doesn't match a database in your account, or
`database_name` doesn't match what you called it in the dashboard.

**Sign-in emails not arriving.** In order: spam folder; Resend's dashboard for
bounces; is `after-i-do.com` verified in Resend.

**Payments not unlocking Premium.** Check the webhook in Stripe first — it's
almost always the wrong URL or the wrong signing secret in Cloudflare.

---

## The short version

1. ~~Cloudflare account~~ ✅ · ~~domain~~ ✅
2. **Create the D1 database** — Storage & Databases, not Workers & Pages
3. Paste its ID into `wrangler.jsonc`
4. One GitHub secret: `CLOUDFLARE_API_TOKEN`
5. Stripe in test mode: product, key, webhook
6. Resend: verify after-i-do.com, get a key
7. Four secrets into Cloudflare; price ID and support email into `wrangler.jsonc`
8. **Test on your phone with card 4242 4242 4242 4242**
9. Switch Stripe to live, redo the Stripe bits, test with a real card, refund
   yourself
10. Check the legal pages, submit your sitemap

**Remaining cost to launch: $0.**
