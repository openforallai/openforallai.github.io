# Working on openforallai

The maintainer reviews everything from a phone, often with little time. Make each change easy to check there.

## Adding rows

1. Follow [CONTRIBUTING.md](CONTRIBUTING.md) exactly. Its rules are the point of this project.
2. **Open every source and find the number on the page before writing the row.** If the page doesn't state it, don't write it. Leave the field empty, or skip the row and say why. Never fill a value from memory.
3. Work on a new branch and open **one pull request per batch**. Never push data to `main` directly.
4. **Who merges (his rule, 2026-09-29):**
   - **Routine rows, merge yourself** once checks pass: a number stated on a primary source (model card, maker's announcement, pricing page or API, government release) that you opened and confirmed, ideally also through an API (e.g. the Hugging Face model API). Then tell him what went live.
   - **Anything needing judgment, leave the pull request open for him:** a new category or column, sources that disagree, a number only in news, a currency conversion he hasn't seen before, a row you'd mark unsure, or deleting or changing an existing row. Say at the top what he has to decide.
5. The pull request description is the record, and what he checks when it's his call. For each row, give:
   - the row in plain words ("DeepSeek-V4-Flash, 284B total, MIT, released 2026-04-22"),
   - the source link,
   - **the exact sentence or table cell on that page** that states each number, quoted.
   Put anything you are unsure about at the top, under **Unsure**.
6. Run `python3 scripts/check_data.py` before opening the pull request.
7. `added_date` is today's date in Korea (KST, UTC+9), not UTC.

## Changing the site

The site is plain HTML, CSS and JavaScript in `index.html` and `assets/`, with no libraries and no build step. Keep it that way. Don't mix site changes into a data pull request.
