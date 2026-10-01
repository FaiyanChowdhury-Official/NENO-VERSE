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
- Order prices are computed server-side from the database in createOrder; orders are inserted only via service role — clients cannot set amount.

- Admin sections live at /admin/$section and dashboard tabs at /dashboard/$tab; access per section is gated by staff area (content/finance/support/admin) via has_staff_area — why: shareable URLs and least-privilege staff.

- Financial orders are archived with deleted_at instead of hard-deleted — why: preserve payment evidence and auditability.

- External course embeds are limited to YouTube, Vimeo, Google Drive, or HTTPS MP4/WebM — why: prevent arbitrary iframe content.
