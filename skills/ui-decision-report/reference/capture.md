# Capture: views, roles, states, screenshots

## Views

A **view** is one screen as one role sees it in one state. Its id joins the three in lower-case ASCII: `orders`, `orders-admin`, `orders-admin-empty`.

1. Find the routes: the router's files (SvelteKit `src/routes`, Next `app/` or `pages/`, Nuxt `pages/`, React Router config, Rails `routes.rb`), the navigation, or a deployed site's links.
2. Find the **roles** in the auth and guard logic: which routes each role reaches, and what changes in a view per role. Make a view per role only where the role changes the view.
3. Find the **states** that matter per view: populated (the default), empty, error, loading only if it lasts, not found (404), forbidden (403), long content. Take the ones that view really has.
4. Give each view: area, label (the route), role, state, the viewports it ships at, and a priority (main, secondary, rare). Default viewports: `desktop` 1440×900 for desk tools, `phone` 390×844 for anything used on the move, and `tablet` 820×1180 only where the product targets tablets.
5. Propose the list as a table grouped by area, with how each state is reached. Stop at **gate 1a**.

## Reaching states

Each view is one `pages` entry in `capture.json` (format in the header of `capture.mjs`). Reach a state with:

- a path or query that shows it (`/orders?status=none`, an id that does not exist for 404);
- seed data or a fixture the project already has for it;
- `actions` (click, fill, press, waitFor, goto) after the page loads.

Interaction runs only against a local database, and preferably undoable steps. Ask before any action that writes to a shared or deployed environment, and never write to production.

## Sign-in

One session per role, saved once and reused for every page of that role. Parallel sign-ins get throttled. Keep session files in your scratchpad, never in the repo: they hold cookies.

Offer the user, per role:

- **They sign in**: start `node <skill-dir>/scripts/capture.mjs login <url> <state-file>` in the background; they sign in in the window that opens and close it.
- **Test account**: only on a local or staging host, with accounts from the project's seed, fixture or example-config files. Write the sign-in steps as an actions list to a file in your scratchpad, and run `login <url> <state-file> <steps-file>`. Never print the values in chat.
- **Public only**: no sign-in; the views behind it are left out.

## Shooting

Run `capture.mjs shoot <round>`. Known traps:

- Use the host the cookies were set for. `localhost` and `127.0.0.1` are different sites to the browser; pick the one the app's own config uses.
- Wait for the real content: set `waitFor` to a selector that only exists once data has loaded. Responsive layouts often keep hidden copies of the same element; add `>> visible=true` (`"text=Operationer >> visible=true"`) when a wait times out on a page that did render.
- Apps that redirect by time of day, feature flag or onboarding state: reach the view with the query or setting that switches the redirect off, and note it in the view list.
- Cookie banners, toasts and dev overlays cover content: dismiss them with `actions`.
- Fixed bars (bottom navigation, sticky headers) can land mid-image in full-page screenshots. That is an artefact of the screenshot, not a defect. Say so in the reviewer briefs.

## Checking

Look at every screenshot yourself before the user sees any. Check that it is signed in as the right role, in the right state, with real content, no error page, and nothing covering it. Fix `capture.json` and shoot again until all pass. Then show the user a sample: one per area and role, plus every non-default state. Stop at **gate 1b**.
