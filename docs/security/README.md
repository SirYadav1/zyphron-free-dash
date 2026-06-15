# security notes

one file per day that had work on it. written the same day, not cleaned up
afterwards, so a day file can contradict the next one. that is on purpose, it shows
what was known at the time.

- `YYYY-MM-DD.md` for the sprint, 2026-06-15 to 2026-06-21
- [FINAL.md](FINAL.md), closeout written at release. full table, status, what is
  still open

## ids

`ZY-nn`, assigned in the order they were found, never reused. an id keeps pointing at
the same issue across files. fixes are referenced by the commit that landed them, not
by a ticket number, because there is no ticket system here.

## severity

not CVSS. three buckets, described in `FINAL.md`, because scoring these by hand with
CVSS numbers would pretend more precision than the review had.

## what these files are not

- not a pentest. no scanner output, no exploitation beyond a curl and a browser.
- not complete. no entry for a day means nothing was found or looked at, not that the
  day was clean.
- no test suite behind any of it. every retest was run by hand.
