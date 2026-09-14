# Planned Kid Computer Services — Final Build Plan

Make the existing app match the uploaded "FINAL BUILD" prompt exactly: no online payment, clean homepage, corrected order specs, document vault with folders, passport-photo flow, admin sidebar console, QZ Tray printing, storage cleanup, and real-time notifications.

## Phase 1 — Design system & homepage
- Replace fonts with Nunito/Quicksand via Google Fonts link in `__root`.
- Lock color tokens to the requested hexes (#1E3A5F, #E67E22, #27AE60, #F5F7FA, #FFFFFF, #1A1A2E).
- Rebuild `/` as a clean intro page: NO top bar, just logo, tagline, subtitle, three buttons (New Order, My Files, Staff Login), contact/hours footer.
- Remove Google sign-in button and branding from `/auth`.

## Phase 2 — Authentication alignment
- Customer sign-up: email + password + phone (store phone in `profiles`).
- Remove Google OAuth flow; keep email/password and password reset.
- Add change-password UI in a new `/settings` route (or admin/customer settings).
- Keep `/admin/login` with seed account `mzedi2012@gmail.com` / `Admin123!`.
- Ensure `/admin/*` redirects unauthenticated users to `/admin/login` and customers away from admin areas.

## Phase 3 — Order flow fixes
- Step 1 choices: Upload, Create (open editor), Scan (camera/file → OCR text extraction).
- Turnaround options: Same-day, 1-day, 2-day only; remove 3–5 day option.
- Paper type labels: Glossy, Matte, Premium, Recycled, Vinyl, Canvas.
- Color labels: Full Color, B&W, Grayscale.
- Binding labels: None, Spiral, Perfect Bound, Stapled, Laminated.
- Capture user location on submit (with consent) and store `location_lat`/`location_lng` on the order.
- Step 3 confirmation: show pickup address, hours, phone, order number.
- Keep "NO PRICE DISPLAYED" for customers.

## Phase 4 — Passport photo flow
- New route `/passport` or mode inside order flow.
- Customer uploads one portrait image, order type = 'passport'.
- Preview the photo; admin detail view shows the image.
- Admin actions: View full, download, approve/reject.

## Phase 5 — Customer document vault
- Replace the current "documents" workspace concept with a folder-based vault.
- Tables: `folders` (user_id, name), `files` (folder_id, user_id, name, url, size, type, order_id).
- Pre-create folders: Passport, Business Cards, Wedding, etc.
- Auto-save every order file into a folder based on order type.
- Search files by name/date; download single or multiple; one-click re-print creates a new order.

## Phase 6 — Admin console redesign
- Build a persistent sidebar layout for `/admin/*` with: Dashboard, Orders, Printers, Passport Photos, Customer Files, Chat, Settings.
- Top bar removed from admin login; sidebar shows admin name and logout.
- Dashboard KPIs: Today's Orders, Pending, Ready, Completed + 7-day bar chart.
- Orders page: full list, filters (status/date/customer), detail sheet, set price, update status, staff notes.
- Passport Photos page: list of passport orders with approve/reject.
- Customer Files page: browse customer vaults.
- Settings page: change password, clean storage.

## Phase 7 — Printing system
- Install `qz-tray` package.
- Add a `printOrder` helper that first tries QZ Tray (connect, find default printer, silent print generated PDF, log to `print_logs`).
- Fallback: generate PDF, open in new window, `window.print()`.
- Print routing hints: passport → Passport folder, small jobs → default/main printer, large jobs → heavy-duty printer (admin can override).

## Phase 8 — Storage cleanup & notifications
- Storage auto-clean: delete files older than 7 days; triggered on admin login and via manual "Clean Storage" button in Settings.
- Real-time admin notifications: new order → sound + badge via Supabase realtime on `orders`.
- Customer notifications: order status = ready → email/Supa base message (use existing `notifications` table).

## Phase 9 — PWA & deployment
- Configure `vite-plugin-pwa` with manifest, service worker, offline fallback.
- Add install button on homepage and persistent mobile install banner (already partially present; wire to PWA plugin).
- Ensure `base: '/'`, static images in `/public`, logo at `/logo.png`.

## Database work
- Align migrations to prompt schema where possible without breaking existing data:
  - `orders`: add `order_type`, `location_lat`, `location_lng`.
  - `print_specs`: already mostly inlined in `orders`; keep inline but rename columns if needed.
  - `folders` and `files`: create if missing.
  - `print_logs`: ensure `operator_id`, `printer_name`, `pages_printed`, `status`.
- Update RLS policies so admins can read/update all orders; customers only their own.
- Seed admin role for `mzedi2012@gmail.com`.

## Acceptance criteria to verify
- [ ] Homepage shows logo + 3 buttons (New Order, My Files, Staff Login).
- [ ] Customer signs up/logs in with email + password + phone.
- [ ] Customer uploads file + specs → submits order.
- [ ] Passport photo order → admin receives image.
- [ ] Admin logs in at `/admin/login` with seed account.
- [ ] Admin sees all orders, sets price, updates status.
- [ ] Admin prints order summary via QZ Tray or fallback dialog.
- [ ] Customer document vault works (folders + files + search + download + re-print).
- [ ] Location auto-captures on order submit.
- [ ] Storage clean removes files older than 7 days.
- [ ] Real-time notifications fire on new order and order-ready.
- [ ] Build passes and preview loads without errors.
