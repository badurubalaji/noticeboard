# 🔗 Connect to a live data feed (URL)

⏱️ This takes about 3 minutes. Do it once. After that, the numbers update on their own.

This is for when your numbers live in another system (a factory dashboard, a sales database, a weather feed…) and that system has an "API" — a web address that returns the latest data when you visit it.

**You probably need help from someone technical** for this guide. Specifically you'll need:

- The web address (URL) of the API.
- Any password or "API key" needed to use it.

If you have a file instead of a URL, see [Upload a JSON file](./03-upload-json.md) — that's much simpler.

---

## What you're going to do

1. Add a data source pointing at the URL.
2. Test that it works.
3. Tell NoticeBoard how often to check for new data.
4. Use the source in a widget.

---

## Step-by-step

### 1. Open Settings → Data Sources

- Click **Settings** in the left menu.
- Click the **🔗 Data Sources** tab.
- Click **+ Add data source**.

### 2. Fill in the basics

- **Name** — what *you* will call this source. E.g. "Production API" or "Stock Levels". Make it obvious — you'll see this name in dropdowns later.
- **Description** (optional) — a note for yourself or the next person.
- **Where does the data come from?** — leave this on **🌐 URL endpoint**.

### 3. Add the URL

Paste the URL into the **URL** box. It should look something like:

```
https://api.yourcompany.com/production/today
```

> 💡 If you see no `http://` or `https://` at the start, ask whoever gave you the URL — it must have one of those.

### 4. Pick the method

The **Method** dropdown has two options:

- **GET** — for almost all cases. Use this unless told otherwise.
- **POST** — only if the person who gave you the URL specifically said "use POST".

### 5. Set the refresh interval

**Refresh every (seconds)** — how often should NoticeBoard ask for new data?

- For numbers that change a few times a day → **300** seconds (5 minutes).
- For live counters → **60** seconds.
- For things that almost never change → **3600** seconds (1 hour).

Minimum is 30 seconds. Don't go too low or you'll spam the other system.

### 6. Add headers (if needed)

Most APIs need an API key or token. The person who gave you the URL will have told you which headers to add. Typical ones:

- `Authorization: Bearer abc123...`
- `X-API-Key: your-secret-key`

To add one:

1. Type the **Header name** (e.g. `Authorization`).
2. Type the **Value** (e.g. `Bearer abc123def456`).
3. Click **+ Add**.

If no one mentioned headers, skip this section.

### 7. Test it!

Click the big **▶ Run test** button on the right side of the dialog.

You'll see one of two things:

#### ✓ Connection succeeded
Below it you'll see the actual data the API returned. **This is good.** Move on to the next step.

#### ✕ Something failed
Most common errors and what they mean:

- **HTTP 401** or **HTTP 403** — your headers are wrong or missing. Ask for the correct API key.
- **HTTP 404** — the URL is wrong. Check for typos.
- **HTTP 500** — the other system is broken. Try again later or call their team.
- **Request timed out** — that system is too slow or offline.
- **Invalid JSON** — the system isn't returning JSON. NoticeBoard needs JSON, not HTML or XML.

Try the fix, click **▶ Run test** again, and repeat.

### 8. (Optional) Set the data path

Sometimes the data you actually want is nested inside the response. For example, the API might return:

```json
{
  "status": "ok",
  "data": {
    "rows": [
      { "name": "Line A", "count": 142 }
    ]
  }
}
```

You probably want the `rows` list — not the whole envelope.

In the **Data path** box, type the path to it. For the example above, that's `data.rows`.

After typing the path, click **▶ Run test** again. The right side now shows "After applying data path:" with just the list — that's what your widgets will see.

> 💡 If your API already returns a list at the top (like `[ {...}, {...} ]`), leave Data path empty.

### 9. Make sure it's Active

Tick **Active** so NoticeBoard auto-refreshes it on the interval.

### 10. Save

Click **Create data source**.

✅ The source appears in your list with a green **GET** or blue **POST** badge.

---

## Use the source in a widget

Now connect it to something on the screen.

1. Go to **Boards → your board → Design**.
2. Add a Table or Chart widget (or click an existing one).
3. In the right panel, scroll to **🔗 Data source**.
4. Pick your new source in the dropdown.
5. For tables: click **✨ Auto-fill from sample**. NoticeBoard reads the first row and sets up the columns.
6. For charts: type the field names for **Label field** (e.g. `name`) and **Value field** (e.g. `count`).
7. Save the board.

✅ Your board now shows live data. It refreshes on its own — no more daily updating!

---

## How often does it actually update?

Two cycles happen:

- **Behind the scenes** — NoticeBoard fetches new data every "Refresh every X seconds" you set on the source.
- **On the TV** — the TV checks for updates every 30 seconds.

So worst case, a change at the source shows on the TV after `your interval + 30 seconds`. For most uses, that's fine.

---

## Useful things to know

### Pause a source temporarily

Edit the source → untick **Active** → save. NoticeBoard stops fetching. Tick it again when you want to resume.

### Force a refresh right now

In the data sources list, click **↻ Refresh** on the source's card. It fetches once, immediately.

### See if it last worked

The card shows one of:

- **✓ Last fetch: 2m ago** — working fine.
- **✕ Last fetch failed — \[error\]** — something's broken; click Edit and re-test.
- **Never fetched yet** — it hasn't run yet. Wait a minute or click **↻ Refresh**.

### What if the URL stops working?

The card switches to ✕ failed, and widgets keep showing the *last successful* data. So a temporary outage doesn't make your TVs go blank.

---

## Something went wrong

### My widget shows "Waiting for data…"

The source hasn't returned data yet. Either:

- It's the first run — wait 30 seconds.
- The source is failing — check the data sources list.

### The widget shows numbers from days ago

Check the source card. If the last fetch is days old, something's broken. Click **↻ Refresh** to force-fetch.

### Some columns are blank

The field name in your column mapping doesn't match a key in the data. Click the widget → check column **key** values match what the API actually returns.

### "Test" works but the board still doesn't show data

Did you click **Save** on the data source? And then on the board?

---

➡️ Next: [Show a board on a TV or tablet](./08-show-on-tv.md)
