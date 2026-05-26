# 📺 Show a board on a TV or tablet

⏱️ This takes about 5 minutes. Do it once per TV.

You've built a beautiful board. Now you need to put it on a TV in the warehouse, on a tablet at reception, or on a kiosk in the lobby.

## What you need

- A TV with internet access and a web browser. (Most modern TVs have this; older ones can use a small device like a Chromecast or Fire TV Stick.)
- The board's "display URL". This is a special link that *only shows the board*, with no admin buttons.
- 5 minutes.

---

## Step-by-step

### 1. Find the display URL

- In NoticeBoard, click **Boards** in the left menu.
- Click the board you want to show.
- Look for a button or link labelled **Display** or **Open display**. It looks like an eye icon 👁️ or says "View".
- The URL it opens looks like:
  ```
  https://your-noticeboard.com/display/abc123def456
  ```

> 💡 **Copy this URL.** You'll paste it into the TV's browser.

### 2. Open the URL on the TV

Method depends on your hardware:

#### Smart TV (Samsung, LG, Sony, etc.)
1. Open the built-in web browser app.
2. Type or paste the URL.
3. Press enter.

#### Tablet (iPad, Android)
1. Open Chrome, Safari, or any browser.
2. Type or paste the URL.
3. Save as a bookmark or add to home screen for quick access later.

#### Chromecast / Fire TV Stick / Android TV
Use the device's built-in browser (or a "kiosk browser" app from the app store). Some devices need a wireless keyboard to type the URL the first time.

#### PC connected to a TV (HDMI)
Use any web browser. Press **F11** to make it fullscreen.

### 3. Make it fullscreen

You don't want browser toolbars showing on the TV.

- Most browsers: press **F11** on a keyboard.
- Touch devices: tap once on the board, then double-tap. NoticeBoard makes itself fullscreen automatically.
- iPad: use the "Add to Home Screen" trick — when you launch it from the home screen, the browser bar disappears.

### 4. Stop the screen from going to sleep

If the screen goes black after a few minutes, find the TV/tablet's display settings and turn off **screen timeout** or **sleep mode**. Each device is different — look for "Display" or "Sleep" in its settings menu.

### 5. Leave it running

That's it. The board updates itself. You don't need to do anything else at the TV.

---

## How the TV stays up to date

- Every **30 seconds**, the TV checks NoticeBoard for changes.
- If you save a change on your computer, the TV will catch up within 30 seconds.
- The TV does this on its own — you never have to refresh it.

---

## Setting up a kiosk (no admin access for staff)

If you don't want walking-by staff to be able to click anything on the TV:

### Easy option: just leave it on the display URL
The display URL has no menu, no buttons, no admin controls — just the board. Even if someone taps the screen, they can't break anything.

### Stricter option: kiosk mode in the browser
Chrome, Edge, and most browsers have a "kiosk mode" that hides everything. Ask your IT to set this up — there's usually a `--kiosk` flag they add to the shortcut.

---

## Multiple TVs

Each TV opens the display URL of the board you want to show there.

- One board can be on many TVs (good for "Company Announcements" everywhere).
- One TV can only show one board at a time.

If you want to rotate between several boards on the same TV, build them as **pages of one board** and set the page rotation timing in the board's carousel settings.

---

## Something went wrong

### TV shows "Board not available"

Two likely causes:

- **Wrong URL.** Double-check by opening the URL on your own computer.
- **Board is paused or deleted.** Open NoticeBoard, find the board, make sure it's set to active.

The text on this screen can be customised — see [Branding](./06-branding.md) → Display Screens.

### TV is just blank

- Network problem — the TV can't reach the internet. Check Wi-Fi.
- Browser issue — try a different browser on the TV.
- Try opening the URL on your phone first to confirm it works.

### TV goes back to its home screen after a while

The TV's screen timeout is kicking in. Disable timeout in the TV's settings.

### The board looks too small / has scroll bars

The browser isn't fullscreen. Press **F11**, or double-tap the board on a touchscreen.

### The clock or date is wrong

The TV's clock is wrong — fix it in the TV's date/time settings.

---

➡️ Next: [Troubleshooting](./09-troubleshooting.md)
