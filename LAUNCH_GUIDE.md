# Launching AfterIDo

Written for someone who is not a developer. No command line, no code. Every
step is a website you log into and a form you fill in.

Read it once end to end before you start anything — it will make more sense
than doing it a step at a time.

---

## What you have right now

Two versions of AfterIDo exist, and it helps to keep them straight:

| | The preview | The real site |
|---|---|---|
| Where | github.io (already live) | Cloudflare (you'll set this up) |
| Address | `jchristadore-ux.github.io/AfterIDo/` | your own domain |
| Free features | Work | Work |
| Accounts | No | Yes |
| Can take payment | **No** | **Yes** |

The preview is honest about this. It doesn't show a broken "Buy" button — the
Premium page says plainly that it isn't connected to a payment processor.

**Nothing in this guide is optional if you want to charge money.** A website
that only serves files — which is what the preview is — cannot verify a payment.
It has nowhere to check anything. That is why the real site needs Cloudflare.

---

## What it costs

| | Monthly | Yearly |
|---|---|---|
| Cloudflare Workers (hosting + the API) | **$0** | $0 |
| Cloudflare D1 (the database) | **$0** | $0 |
| Accounts / sign-in (built in) | **$0** | $0 |
| Analytics (built in) | **$0** | $0 |
| Resend (sending email) | **$0** | $0 |
| Stripe | **$0** | $0 |
| Your domain name | — | **$10–20** |
| **Total** | **$0/month** | **$10–20/year** |

**Startup cost: the price of a domain name. Nothing else.**

Stripe takes 2.9% + 30¢ from each sale. On a $19.99 purchase that's about
$0.88, so you keep about $19.11.

### When would this stop being free?

The free tiers are generous, and you will know long before you get near them:

- Cloudflare Workers: 100,000 requests a day. Roughly 15,000–20,000 visitors a
  day. Past that it's $5/month.
- Cloudflare D1: far more storage and reads than this app will use. The app
  stores only email addresses and purchase records, so this is not a realistic
  concern.
- Resend: 3,000 emails a month, 100 a day. That's 3,000 sign-ins and receipts.
  Past that, $20/month.

If you cross any of these you are making far more than $5 a month.

---

## Before you start, decide two things

**1. Your domain name.** Buy it from Cloudflare Registrar (they sell at cost,
around $10/year for a `.com`, with no renewal price hike) once you have a
Cloudflare account. Namecheap or Porkbun are fine alternatives.

**2. Your support email address.** Real customers will write to it about
refunds and problems. A Gmail address is fine to start. It goes on the Contact
page, the Privacy Policy and the Terms.

---

## Step 1 — Cloudflare

**Time: about 20 minutes.**

1. Go to **dash.cloudflare.com** and create a free account.

2. If you're buying your domain from Cloudflare: **Domain Registration →
   Register Domain**. If you bought it elsewhere: **Add a site** and follow the
   instructions to point it at Cloudflare (you'll change two "nameserver"
   settings at the company you bought it from — they all have a help page for
   this).

3. In the left sidebar, click **Workers & Pages**. On the right of that page
   you'll see your **Account ID** — copy it somewhere, you'll need it shortly.

4. Create the database. Still under Workers & Pages, go to **D1 SQL Database →
   Create**. Name it exactly:

   ```
   afterido
   ```

   When it's made, copy the **Database ID** it shows you.

5. Create an API token. Go to **My Profile → API Tokens → Create Token**, pick
   the **Edit Cloudflare Workers** template, and create it. Copy the token —
   Cloudflare will only show it once.

---

## Step 2 — Tell GitHub about Cloudflare

**Time: 5 minutes.**

1. In your GitHub repository, go to **Settings → Secrets and variables →
   Actions**.
2. Click **New repository secret**, twice:

   | Name | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the token from step 1.5 |
   | `CLOUDFLARE_ACCOUNT_ID` | the Account ID from step 1.3 |

Until both of these exist, the deploy step quietly skips itself, so nothing is
broken while you're partway through.

---

## Step 3 — One file to edit

**Time: 5 minutes.**

In your repository, open `wrangler.jsonc` (click the file, then the pencil
icon). Find this line:

```jsonc
"database_id": "REPLACE_WITH_YOUR_D1_DATABASE_ID",
```

Replace it with the Database ID from step 1.4, keeping the quotes.

Then find the `vars` block near the bottom and fill in these three:

```jsonc
"PUBLIC_ORIGIN": "https://afterido.com",     ← your real domain, with https://
"EMAIL_FROM": "AfterIDo <hello@afterido.com>",
"SUPPORT_EMAIL": "you@gmail.com",
```

Leave `STRIPE_PRICE_ID` empty for now — Stripe comes next.

**`PUBLIC_ORIGIN` matters more than it looks.** It's the address that goes into
every sign-in link you email. Get it wrong and the links won't work.

Click **Commit changes** at the bottom.

---

## Step 4 — Stripe, in test mode

**Time: 20 minutes.** Do this in test mode first. You will not be able to take
real money until you finish step 7, and that is deliberate.

1. Create an account at **stripe.com**.

2. Make sure the **Test mode** toggle at the top right is **on**. Everything in
   this step happens in test mode.

3. **Product catalogue → Add product**:
   - Name: `AfterIDo Premium`
   - Price: `19.99` USD
   - Pricing model: **One time** ← this matters. Not recurring.
   - Save it, then copy the **Price ID**. It starts with `price_`.

4. **Developers → API keys**. Copy the **Secret key** (starts with `sk_test_`).

5. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://YOURDOMAIN.com/api/stripe/webhook`
   - Events to send — select these four:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `charge.refunded`
     - `charge.dispute.closed`
   - Save, then copy the **Signing secret** (starts with `whsec_`).

**What the webhook is for:** it's how Stripe tells your site that a payment
succeeded. Everything about who gets Premium depends on it. Without it, people
would pay and not get what they bought.

---

## Step 5 — Resend, for email

**Time: 10 minutes.** You can skip this and come back — sign-in links just
won't send until you do.

1. Create an account at **resend.com**.
2. **Domains → Add Domain**, enter your domain, and add the DNS records it
   shows you. If your domain is on Cloudflare, Resend can often add them for
   you; otherwise copy them into Cloudflare's **DNS** section.
3. **API Keys → Create API Key**. Copy it (starts with `re_`).

---

## Step 6 — The four secrets

**Time: 10 minutes.** These go into Cloudflare, not GitHub, because they are
what your live site uses.

Go to **Workers & Pages → afterido → Settings → Variables and Secrets**. For
each one below, click **Add**, choose **Secret** (not Text), and paste:

| Name | Value | Where it came from |
|---|---|---|
| `SESSION_SECRET` | a long random string — see below | you make it up |
| `STRIPE_SECRET_KEY` | `sk_test_...` | step 4.4 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | step 4.5 |
| `RESEND_API_KEY` | `re_...` | step 5.3 |

**For `SESSION_SECRET`**, open a new browser tab, press F12, click "Console",
and paste this, then press Enter:

```js
crypto.randomUUID() + crypto.randomUUID()
```

Copy the result (without the quotes). It must be at least 32 characters. Never
share it — it's what keeps other people out of your customers' accounts.

Then go back to `wrangler.jsonc` in GitHub and fill in the price:

```jsonc
"STRIPE_PRICE_ID": "price_...",   ← from step 4.3
```

Commit that, and your site will deploy with everything connected.

**Your site is now live and can take test payments.**

---

## Step 7 — Test it before you take real money

**Time: 15 minutes. Do not skip this.**

On your phone, go to your domain and do the whole thing as a customer would:

- [ ] The landing page loads and looks right
- [ ] "Start My Name Change" walks through the questions
- [ ] At the end, it offers to save your plan — enter your email
- [ ] **The sign-in email arrives.** Check spam. Click the link.
- [ ] You land back in your plan, signed in
- [ ] Go to Pricing. It says **"Stripe is in test mode — no real charge will be
      made."**
- [ ] Click "Unlock Premium". You're sent to Stripe's payment page.
- [ ] Pay with the test card: **4242 4242 4242 4242**, any future expiry, any
      3-digit code, any postcode
- [ ] You come back and Premium unlocks within a few seconds
- [ ] The Letters page shows real letters with your name in them
- [ ] **The receipt email arrives**
- [ ] Sign out, sign in again — Premium is still there

Now test that failure works properly:

- [ ] Sign out. Open the Pricing page. It asks you to make an account before
      buying — it does not offer a broken button.
- [ ] Start checkout again and press **back** on Stripe's page instead of
      paying. You return with "your payment was cancelled" and **Premium stays
      locked.**

**If Premium unlocks without a payment, stop and do not go live.** That would
mean anyone could take it for free.

### Going live

Once the whole list passes:

1. In Stripe, switch **Test mode** off.
2. Complete Stripe's account activation (bank details, your legal information).
   Stripe will not release money until this is done.
3. Redo step 4.3 (the product), 4.4 (the key) and 4.5 (the webhook) **in live
   mode** — live and test mode are separate worlds and nothing carries over.
4. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Cloudflare with
   the live values, and `STRIPE_PRICE_ID` in `wrangler.jsonc`.
5. Buy it yourself with a real card. Then refund yourself from the Stripe
   dashboard, and check that Premium switches off — that proves refunds work
   before a stranger needs one.

---

## Step 8 — Before you tell anyone about it

**Legal.** Open `src/config/site.ts` and check three things:

```ts
legalEntity: 'AfterIDo',
```
If you've registered a company, put its registered name here. If you're
trading as yourself, put your own name. This appears in the Terms and the
Privacy Policy as the person the customer is contracting with.

```ts
governingLaw: 'the State of New Jersey, United States',
```
Where you actually live or are incorporated — not where your customers are.

```ts
refundWindowDays: 30,
```
The window the Terms promise. Honour it.

Then read `/privacy`, `/terms` and `/disclaimer` on your own site. They're
written to describe what this app actually does, so they're accurate today —
but they're your promises now. **If you're taking money from the public, having
a lawyer read them once is money well spent.** This guide is not legal advice.

**Search engines.**

1. Go to **search.google.com/search-console** and add your domain.
2. Submit your sitemap: `https://yourdomain.com/sitemap.xml`
3. It'll take a few weeks to show up in results. That's normal.

**Check the link preview.** Send yourself the link in a text message. You should
see the pink-and-white AfterIDo card, not a blank box.

---

## How you'll know if it's working

Everything is already being counted — no extra service, no tracking pixel, no
cost. To see the numbers, go to **Workers & Pages → D1 → afterido → Console**
and paste this in:

```sql
SELECT day, name, COUNT(*) AS n
FROM events
WHERE day >= date('now', '-14 days')
GROUP BY day, name
ORDER BY day DESC, n DESC;
```

You'll see counts like `landing_viewed`, `onboarding_completed`,
`checkout_started` and `purchase_completed` per day.

The number that matters most:

```sql
SELECT
  SUM(name = 'landing_viewed')     AS visitors,
  SUM(name = 'onboarding_completed') AS finished_setup,
  SUM(name = 'purchase_completed')   AS bought
FROM events
WHERE day >= date('now', '-30 days');
```

If lots of people finish onboarding and nobody buys, the price or the Premium
pitch is wrong. If nobody finishes onboarding, the questions are too long or
the landing page is promising the wrong thing.

**These counts cannot tell you who anyone is.** There's no user ID, no IP
address and no cookie in them — deliberately. That's the trade: you get to see
what's working, and your customers don't get tracked.

---

## Things that will come up

**"Someone says they paid but doesn't have Premium."**
Look them up in Stripe by email. If the payment succeeded, check
**Developers → Webhooks** in Stripe — click your endpoint and look for failed
deliveries. Stripe retries automatically for up to three days. You can also
just ask them to visit `/premium/success` again, or refund them.

**"I want to give someone Premium for free."**
Cloudflare → D1 → afterido → Console:
```sql
UPDATE users SET plan = 'premium', plan_granted_at = unixepoch()
WHERE email = 'them@example.com';
```
They need to have signed in at least once first, or there's no row to update.

**"Someone wants their data deleted."**
They can do it themselves: Profile → Delete my account. Or run:
```sql
DELETE FROM users WHERE email = 'them@example.com';
```
Their purchase record stays, without their email attached — that's deliberate,
because you need financial records and they contain nothing identifying.

**"I want to change the price."**
Make a *new* Price in Stripe (don't edit the old one — existing records point
at it), then update `STRIPE_PRICE_ID` in `wrangler.jsonc` and `PRICE_LABEL` to
match. People who already bought keep what they bought.

**"A government link is broken / a requirement changed."**
`src/data/tasks.ts` holds every task and every link, and
`src/data/states.ts` holds the state-specific guidance. Both are plain lists —
edit the text, commit, and it's live in about two minutes. Update the
`lastReviewed` date when you check a state.

**"I want to add proper detail for another state."**
`src/data/states.ts` — copy the New Jersey block, change the details, add it to
`STATE_GUIDANCE`. Until you do, that state's page says honestly that you
haven't verified the local specifics, and links to the official agency. That's
better than guessing, and it's why the app can cover all fifty states without
making anything up.

---

## What to do if something breaks

**The site is down.** Cloudflare → Workers & Pages → afterido → **Logs**. It
shows what actually happened.

**A deploy failed.** GitHub → **Actions** tab → click the red run. The step that
failed is expanded, and the error is usually the last few lines.

**Sign-in emails aren't arriving.** In order: check spam; check Resend's
dashboard for bounces; check your domain is verified in Resend; check
`EMAIL_FROM` uses that same domain.

**Payments aren't unlocking Premium.** Check the webhook in Stripe first — it's
almost always either the wrong URL or the wrong signing secret in Cloudflare.

---

## The short version

1. Cloudflare account, database called `afterido`, API token → GitHub secrets
2. Fill in `wrangler.jsonc`: database ID, your domain, your email
3. Stripe in test mode: product, key, webhook
4. Resend: verify your domain, get a key
5. Four secrets into Cloudflare, price ID into `wrangler.jsonc`
6. **Test the whole thing on your phone with card 4242 4242 4242 4242**
7. Switch Stripe to live, redo the Stripe bits, test again with a real card
8. Check the legal pages, submit your sitemap

**Total cost to get here: the price of a domain name.**
