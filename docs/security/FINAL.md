# security closeout - zyphron free dashboard

written at public release, 2026-07-18. covers 2026-06-15 to 2026-07-18.

## method

manual review of the code, plus a few live probes on the vps. no saas scanners, no
static analysis tooling. every finding was reproduced by hand and re-tested by hand
after the fix. there is no test suite, so nothing here is covered by ci.

severity is my own call, not CVSS. rough mapping:
high = no session needed, medium = needs a session or a race, low = leak or hardening.

## findings

| id | sev | what | fixed in | status |
|---|---|---|---|---|
| ZY-01 | med | login throttle too loose | `c1e9418` | fixed |
| ZY-02 | med | no password complexity | `c1e9418` | fixed |
| ZY-03 | med | username charset open | `c1e9418` | fixed |
| ZY-04 | low | x-powered-by header | `c1e9418` | fixed |
| ZY-05 | low | csp unsafe-inline | `c1e9418` | fixed |
| ZY-06 | low | nginx config not in vcs | - | open |
| ZY-07 | med | smtp password plaintext | `5cf3162` | fixed |
| ZY-08 | med | admin password change no-op | `637f744` | fixed |
| ZY-09 | med | 50mb body limit | `63877fa` | fixed |
| ZY-10 | med | login error enumeration | `63877fa`,`1fd04ad` | fixed |
| ZY-11 | med | no failed-login lockout | `63877fa` | fixed |
| ZY-12 | high | nests/eggs endpoints public | `63877fa` | fixed |
| ZY-13 | low | csp unsafe-eval | manual | fixed |
| ZY-14 | med | no password reset flow | `fd893b9` | fixed |
| ZY-15 | low | backup archive holds .env unencrypted | - | open |
| ZY-16 | high | admin guard ignored roles | `5b22215`,`94294ee` | fixed |
| ZY-17 | low | mail module circular dependency | `e053c43` | fixed |
| ZY-18 | low | ENCRYPTION_KEY missing from .env.example | - | open |
| ZY-19 | high | open registration | `7946a05` | fixed |
| ZY-20 | high | api keys stored plaintext | `08691f5` | fixed |
| ZY-21 | low | nginx headers never applied | manual | fixed |
| ZY-22 | med | password in notification mail | `1fd04ad` | fixed |
| ZY-23 | med | reset otp from Math.random | `1fd04ad` | fixed |
| ZY-24 | med | discord oauth state in memory | `fe7dd24` | fixed |
| ZY-25 | med | no coin ceiling | `08691f5` | fixed |
| ZY-26 | high | server name not sanitized | `08691f5` | fixed |
| ZY-27 | high | upload trusted content-type | `08691f5` | fixed |
| ZY-28 | high | live panel urls in views and test page | `f0909a7`,`6651cbf` | fixed |
| ZY-29 | high | .env with live keys in an old server backup | rotated | fixed |
| ZY-30 | low | personal email in readme | `6651cbf` | fixed |

8 high, 13 medium, 9 low. 27 fixed, 3 open.

## what is still open

**ZY-06 - nginx config is not in the repo.**
autoindex, the security headers and the proxy block only exist on the box. a rebuild
from this repo alone gives a server with no headers. fix is to commit the site config
under `deploy/`.

**ZY-15 - backup archive contains secrets.**
`scripts/backup.sh` tars `.env` and `zyphron.db` into `/root/backups` with no
encryption. this is how ZY-29 happened: a june archive sat there readable with live
keys inside. the directory is 0700 now and archives are copied off-box, but the
contents are still plaintext. either encrypt with a passphrase kept off-box, or drop
`.env` from the tar and store it separately.

**ZY-18 - ENCRYPTION_KEY is not in .env.example.**
the util throws when it is missing, so a fresh clone that saves an smtp password gets
a stack trace instead of a mail. one line in `.env.example` and one in the readme.

## release prep, 2026-07-15 and 07-18

`f0909a7` removed the panel urls from `test-pterodactyl.html`, `6651cbf` did the same
for the fallbacks in the vue views (`panel.zyphron.cloud`, `console.zyphron.cloud`)
and dropped the personal email from the readme. those are ZY-28 and ZY-30 above.

ZY-29 came out of the same pass: a tar in `/root/backups` from june still had a
`.env` with live `JWT_SECRET`, `PTERODACTYL_API_KEY`, `DISCORD_CLIENT_SECRET`,
`DISCORD_BOT_TOKEN` and `ADMIN_KEY`. directory was 0755 so any local account could
read it. tar removed, backups moved off-box, all five values rotated. nothing to fix
in the repo, that archive was never tracked.

## two things worth knowing before reading the code

1. `ENCRYPTION_KEY` is the key material for every stored `enc:` value (smtp password,
   reset tokens). rotating it makes those rows unreadable. there is no re-encrypt
   migration.
2. `scripts/seed-admin.ts` falls back to `AdminPassword123!` when no argument is
   passed. passing one avoids it, but the default is still in the file.

## accepted risk

- single-tenant deployment, no multi-tenant isolation to break.
- rate limits are in-process (throttler), so they reset on restart and are per worker.
- deployment is pm2 and one sqlite file. no replicas, so no distributed consistency
  problems, but a disk loss is a full loss aside from the backup archive above.
- no dependency audit in ci. `npm audit` gets run by hand, occasionally.
