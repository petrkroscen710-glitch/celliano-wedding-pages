# Celliano – public website staging

This repository is now the public staging/runtime candidate for the **entire Celliano website**, not only the wedding section.

Current staged pages:
- Home
- O nás
- Svatby
- Firemní akce
- Ukázky
- Reference
- Co hrajeme
- Akce
- Kontakt

Safety:
- the current live site at https://celliano.cz is untouched;
- staging is set to noindex/nofollow and robots.txt disallows crawling;
- source content was copied from the restored stable production snapshot;
- before final cutover, the contact form backend and local image assets must be migrated/verified.

Goal: after final cutover, normal public-site edits can be managed from GitHub without repeated manual editing in Hostinger.
