<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the visual theme centralized in `src/styles.css` and shared Button/Card variants so every workspace inherits visual updates without changing workflows.
- Use the public /print route for guest submissions and the authenticated /admin route for the focused staff panel; retain legacy workspace modules without promoting them in the current flow.
- Store guest orders in guest_print_orders with staff-only read/update policies, private storage and validated server-only submission; guest identity cookies never authorize reads.
- Print actual private PDF/image bytes through QZ Tray with order options, never a receipt as the primary print action.
- Prepare guest passport portraits on-device with background segmentation and an adjustable crop; send measured PDF sheets and disable QZ scaling to preserve physical dimensions.
- Keep recent submitted file bytes in device-local IndexedDB, never authorize private order reads with customer cookies or local file history.
