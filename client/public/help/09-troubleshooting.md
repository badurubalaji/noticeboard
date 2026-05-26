# ❓ Troubleshooting

Stuck? Skim this page for your problem.

---

## <a id="board-not-available"></a>The TV shows "Board not available"

This is the most common one. It means the TV is open, but can't reach the board.

**Quick checks:**

1. **Is the URL correct?** Open the URL on your own computer. If you also see "Board not available", the URL is wrong. Go to **Boards**, find the board, and copy the correct display link.
2. **Has the board been deleted?** Open NoticeBoard → Boards. If the board isn't there, it was deleted. You'll need to recreate it or restore from a backup.
3. **Is the board paused / not active?** Edit the board and look for an "Active" tickbox — make sure it's on.

> 💡 You can customise this message to include your support contact. See [Branding → Display Screens](./06-branding.md).

---

## <a id="data-not-updating"></a>I changed the data and the TV still shows the old version

NoticeBoard updates TVs automatically, but it takes a few seconds.

**Try these in order:**

1. **Wait 30 seconds.** That's the normal refresh time.
2. **Make sure you clicked Save.** Most screens have a Save button at the top right. If you didn't click it, the change isn't stored.
3. **Refresh the TV's browser.** F5 on a keyboard, or pull down to refresh on a tablet.
4. **Open the same display URL on your phone.** If your phone shows the new data but the TV doesn't, the TV's browser is stuck — restart the TV's browser app.

### If it's a data source (URL or JSON):

5. Go to **Settings → 🔗 Data Sources**.
6. Find your source. The card shows "✓ Last fetch: 2m ago" if it's working.
7. If it says "✕ Last fetch failed", click **Edit** and look at the error.
8. Click **↻ Refresh** to force a fetch right now.

---

## <a id="tv-not-changing"></a>I saved a change and the TV looks the same after 5 minutes

This means the change *didn't actually save*, or the TV is opening the wrong board.

**Quick checks:**

1. **Did you press Save?** Check the top-right corner of the design view.
2. **Did you change the same board the TV is showing?** Two boards might have similar names. The TV's URL contains the board's ID — compare it to the URL of the board you edited.
3. **Is someone else editing the board at the same time?** They might be overwriting your changes. Refresh the board page and re-save.

---

## <a id="image-issues"></a>My picture is too big / cut off / blurry / sideways

### Too big or too small

Click the image widget on the board. In the right panel, scroll to **Fit & Size**:

- **Fit mode: Fit inside (show whole image)** — never crops, but may have empty space.
- **Width / Height sliders** — drag to take up less of the widget.

### Cut off on the sides

You're probably using **Fill widget (crop to fit)**. The picture is the wrong shape for the box. Either:

- Switch to **Fit inside** (and pick a background colour to fill the empty space), or
- Resize the widget so it matches the picture's shape better.

### Blurry / pixelated

Your original file is too small. Re-export it at a higher resolution (look for the original Photoshop/Figma file, or ask the designer).

### Sideways or upside down

Open the file on your computer, rotate it to the right orientation, save it, then re-upload it on NoticeBoard.

---

## My JSON upload says "Invalid JSON"

The file isn't really JSON, or it's broken.

**Try these:**

1. **Open the file in Notepad** (Windows) or **TextEdit** (Mac).
2. Look at the very first character. If it's not `{` or `[`, the file is the wrong format.
3. **Check for HTML at the top** — if the file starts with `<` or `<!DOCTYPE`, it's HTML, not JSON. Ask for a JSON export.
4. **Re-export the file** from whichever system you got it from.

If you pasted JSON instead of uploading, you may have accidentally included extra text — make sure the very first and last characters are matching brackets (`{...}` or `[...]`).

---

## Some columns in my bound table are blank

The data has different field names than your columns expect.

**Fix:**

1. Go to **Settings → Data Sources** → click **Edit** on the source.
2. Click **▶ Run test**.
3. Look at the preview — note the actual field names (e.g. `"production_line"`, not `"line"`).
4. Go back to the board → click the table widget.
5. In the right panel, scroll to **🔗 Data source → Columns**.
6. Click **✨ Auto-fill from sample** to re-detect the columns, or fix the **key** values by hand.

---

## My chart is empty even though I picked a data source

Charts need two things to render:

- A **Label field** (e.g. `name`) — what goes on the X axis or pie slices.
- A **Value field** (e.g. `count`) — the numbers.

If either is blank or doesn't match an actual field in the data, the chart shows nothing.

**Fix:**

1. Test the data source so you can see the field names.
2. In the widget's **🔗 Data source** panel, type the correct field names.
3. Save the board.

---

## Pages flip too fast / too slow

In the board's edit view, look for **Carousel settings**:

- **Auto-play** — flip pages on a timer (turn off if you want manual flipping).
- **Interval** — seconds each page is shown. Typical values: 10–30 seconds.
- **Transition** — slide / fade / zoom / flip animation.

---

## I deleted something by accident

NoticeBoard doesn't have an undo button.

**For boards, notices, templates, data sources:** ask your admin if there's a backup. If not, you'll need to recreate it.

**For widgets within a board:** as long as you haven't clicked Save since deleting, you can press **Ctrl + Z** (Windows) or **⌘ + Z** (Mac) — but only in the same browser session.

---

## I can't sign in

- **Wrong password?** Click "Forgot password" or ask your admin to reset it.
- **"Account is deactivated"?** Your admin disabled your account. Ask them to re-enable it.
- **"Invalid email or password"?** Check spelling and case. Email is usually all lowercase.

---

## My data source has a green ✓ but the board says "Waiting for data…"

The widget isn't pointed at the source properly. Click the widget → check **🔗 Data source**:

- Is the right source picked in the dropdown?
- Are columns / chart fields filled in?
- Click Save on the board.

If you just created the source, also wait 30 seconds — the TV will catch up.

---

## My logo / colours look right in Settings but wrong on the TV

The TV might be caching the old branding.

**Fix:**

1. Refresh the TV's browser (F5).
2. If it persists, clear the browser's cache:
   - Open browser settings on the TV.
   - "Clear browsing data" → tick "Cached images and files" → clear.
   - Reload the display URL.

---

## I'm seeing buttons / menus on the TV that I don't want staff to see

You opened the *admin* URL on the TV, not the *display* URL.

- Admin URL looks like `https://yoursite.com/boards/abc123` or `/dashboard`.
- Display URL looks like `https://yoursite.com/display/abc123`.

Open the display URL instead.

---

## Still stuck?

Send your admin or IT contact:

1. **What you were trying to do.** ("I'm trying to update the warehouse board.")
2. **What you did.** ("I changed three numbers and clicked Save.")
3. **What happened.** ("The TV still shows the old numbers after 10 minutes.")
4. **The URL of the board or TV.** Just copy-paste it.

Those four bits help them help you fast.
