# Working on openforallai

The maintainer reviews everything from a phone, often with little time. Make each change easy to check there.

## Adding rows

1. Follow [CONTRIBUTING.md](CONTRIBUTING.md) exactly. Its rules are the point of this project.
2. **Open every source and find the number on the page before writing the row.** If the page doesn't state it, don't write it. Leave the field empty, or skip the row and say why. Never fill a value from memory.
3. Work on a new branch and open **one pull request per batch**. Never push data to `main` directly.
4. The pull request description is what he checks. For each row, give:
   - the row in plain words ("DeepSeek-V4-Flash, 284B total, MIT, released 2026-04-22"),
   - the source link,
   - **the exact sentence or table cell on that page** that states each number, quoted.
   Put anything you are unsure about at the top, under **Unsure**.
5. Run `python3 scripts/check_data.py` before opening the pull request.
6. `added_date` is today's date in Korea (KST, UTC+9), not UTC.

## Changing the site

The site is plain HTML, CSS and JavaScript in `index.html` and `assets/`, with no libraries and no build step. Keep it that way. Don't mix site changes into a data pull request.
