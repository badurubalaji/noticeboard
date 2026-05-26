# 📤 Upload a new JSON file with today's numbers

⏱️ This takes about 1 minute.

Sometimes someone gives you a `.json` file with the latest figures (often emailed from an IT system or exported from another tool). Here's how to put those numbers on the TV.

## When to use this guide

✅ Someone hands you a file ending in `.json` and asks you to "update the board".
✅ You already set up a **data source** earlier and now have a fresh file for it.

❌ You want to type numbers in by hand → see [Change numbers in a table](./02-update-table.md).
❌ Numbers come from a website automatically → see [Connect to a URL](./07-connect-url.md).

---

## First time only: create the data source

If this is the **first** time you're using this file, do this once. After that, skip to "Updating with a new file" below.

### 1. Open Settings → Data Sources

- Click your name (top right) or the **Settings** link.
- Click the **🔗 Data Sources** tab.
- Click **+ Add data source**.

### 2. Fill in the form

- **Name** — Something you'll recognise, e.g. "Daily Production Numbers".
- **Description** — Optional. A note for yourself.
- **Where does the data come from?** — Click **📄 JSON file / paste**.

### 3. Upload the file

- Click the big dotted box that says "Click to upload .json".
- Pick the file on your computer.
- You'll see "JSON loaded" and a preview on the right.

### 4. Tell it where the data lives (optional)

If your file looks like this:

```json
{
  "report": {
    "rows": [
      { "line": "A", "count": 142 },
      { "line": "B", "count": 89 }
    ]
  }
}
```

Then in the **Data path** box, type `report.rows`. That tells NoticeBoard "skip past the wrapper and use the list inside".

If your file is *already* just a list at the top level, leave **Data path** empty.

> 💡 **Not sure?** Look at the preview on the right. If you see `[ ... ]` (a list) at the top, leave Data path blank. If you see `{ "something": [ ... ] }`, type the name of `something` in Data path.

### 5. Save

Click **Create data source**. Your source now shows up in the list with a purple **JSON** badge.

### 6. Use it in a widget

- Go to your board → click **Design**.
- Click the table or chart widget you want to fill.
- Scroll down in the right panel to **🔗 Data source**.
- Pick your new source from the dropdown.
- For tables, click **✨ Auto-fill from sample**. This sets up the columns for you.
- Click **Save** at the top right.

✅ **Done!** Your board now shows the data from the file.

---

## Updating with a new file (the daily task)

Got a fresh file? Here's the quick version.

### 1. Open Settings → Data Sources

### 2. Click "Edit" on the source

Find the source in the list (the one with the purple **JSON** badge). Click **Edit**.

### 3. Upload the new file

In the **📄 JSON file / paste** section:

- Click the upload box (it may say "Click to replace").
- Pick the new file.
- The preview on the right updates.

### 4. Click "Save changes"

That's it. All the boards using this source update on their own — usually within a few seconds. No need to touch the boards.

✅ **Done!**

---

## Tips for non-technical readers

### What is a JSON file?

A `.json` file is just a text file with information in it, formatted in a way computers can read easily. You can open one in Notepad if you want, but you don't have to. NoticeBoard does all the reading for you.

### What if I open the file and it looks like gibberish?

That's normal. It's not for humans to read directly. As long as it was exported from a real system (and the file ends in `.json`), NoticeBoard will understand it.

### What if I paste JSON instead of uploading?

Same result. Use the **Or paste JSON directly** box on the same screen. Click **✓ Parse** when you're done to check it's valid. If you see "✓ Valid JSON" you're good.

### The file is huge — will it work?

If it's under 5 MB, yes. If it's bigger than 5 MB, ask whoever sends it to filter it down first, or split it into smaller files.

### Can I delete an old source?

Yes — in the list, click **Delete** on the card. NoticeBoard will warn you which widgets use it. If you delete it, those widgets fall back to whatever was typed in by hand.

---

## Something went wrong

### "Invalid JSON" appears

The file isn't really JSON, or it's broken. Ask the person who sent it to re-export it. Or, if you copy-pasted, you probably included an extra character (like a quote mark or space) — try again.

### The board still shows old data after I uploaded

Wait 10–30 seconds. The TVs refresh on their own. If it's still old after a minute:

- Refresh the TV's web browser (someone may need to do this physically at the TV).
- Open `Settings → Data Sources` again, click your source, and confirm the preview shows the new data.

### I uploaded but the widget still shows static numbers

Open the board's **Design** view, click the widget, and check the **🔗 Data source** panel on the right:

- Is a source selected in the dropdown?
- For tables: are columns listed? If not, click **✨ Auto-fill from sample**.

Save the board after fixing.

---

➡️ Next: [Replace a picture on a board](./04-replace-image.md)
