# Celliano full-site cutover plan

## Current state
The complete public Celliano site is staged here and GitHub Pages builds it automatically. The current production site at https://celliano.cz remains unchanged.

## Final architecture
Use this repository as the editable source of truth for the entire public website. The preferred production target is a Hostinger **Custom PHP/HTML** website connected to GitHub, because that preserves the PHP enquiry endpoint while allowing Git-based deployment.

Hostinger AI/Website Builder itself does not support Git deployment, so the final cutover must be done to a custom PHP/HTML site rather than by inserting separate embeds page-by-page.

## Before production cutover
1. Create/confirm a Custom PHP/HTML website in the existing Hostinger hosting plan.
2. Connect this repository through Hostinger Advanced -> Git.
3. Deploy to a staging directory first.
4. Copy the two local image assets used by Home and O nás into /assets, or replace those references with permanent CDN URLs.
5. Verify the enquiry form, events, repertoire, gallery, navigation and mobile layout.
6. Replace staging noindex/nofollow and robots.txt with production indexing rules.
7. Point celliano.cz to the custom site only after all checks pass.

Do not remove the current live Builder/custom site until the new deployment is verified.
