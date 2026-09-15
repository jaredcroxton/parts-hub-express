# SOP: Odoo MCP connector (Sadeem MCP)

Layer 2 resource. Lets Claude read and, if allowed, write ACBG's Odoo during build and maintenance. Not part of the runtime pipeline. Written 2026-09-14 from the vendor listing (apps.odoo.com, v1.260809001, 2026-08-09).

## What it is

- Odoo addon, technical name `sadeem_mcp`, by Sadeem Cloud (sadeem.cloud, support@sadeem.cloud). USD 23.24 one-time, OPL-1 licence. Versions for Odoo 17, 18, 19. Depends on Discuss (mail).
- Adds an MCP endpoint to the Odoo instance at a per-database URL with a random segment.
- Auth is OAuth 2.1 with PKCE. Each person signs in with their own Odoo login. No API keys, no secrets in URLs. Old API-key setup was removed in the August 2026 release; older guides online are stale.
- Two permission tiers chosen at sign-in: Read, or Read and Write. Delete is never available.

## Where it fits

| Path | Who talks to Odoo | How | When |
|---|---|---|---|
| Build and maintenance | Claude (claude.ai or Claude Code) | Sadeem MCP over OAuth | Ad hoc, when a person asks |
| Runtime catalogue sync | Site backend | Odoo JSON-RPC or JSON-2 API, API key for a read-only user | Nightly cron plus manual "sync now" |
| Order push | Site backend | Same API, write access to sale.order | On Stripe payment webhook |
| Stock check at checkout | Site backend | Same API, one read per order | Before payment |

MCP never touches public traffic. The website never depends on Claude being online.

## Hosting gate

- Odoo.sh and self-hosted: install from the app store or upload the zip. Works.
- Odoo Online (SaaS): Odoo does not allow third-party modules. The listing ticks "Odoo Online" but that flag is vendor-set. Treat as unavailable on Odoo Online until Sadeem confirms in writing.
- Either way, the client's Odoo plan must allow API access for the runtime path. Odoo Online: Custom plan only. Discovery Q17 and Q17b answer this.

## Install and configure (client side, in this order)

1. Buy and install `sadeem_mcp` from the Odoo Apps store.
2. Settings, Claude AI Connector, toggle "Enable MCP Endpoint" on. Copy the generated connector URL.
3. Settings, Users and Companies, Users. Tick "MCP: Can Connect" on each user allowed to connect. Create a dedicated user for Managed Digital with Inventory and Sales read rights only.
4. HTTPS is required. Behind a reverse proxy, Odoo must run with `--proxy-mode` so it advertises https URLs. Plain HTTP sign-in is refused.

## Connect from claude.ai

1. Settings, Connectors, Add custom connector.
2. Paste the connector URL. Leave OAuth Client ID and Secret blank. Dynamic registration handles it.
3. Connect. Sign in with the Odoo user. Choose Read or Read and Write.
4. In a chat, press the plus button and enable the connector.
5. Needs Claude Pro, Team, or Enterprise.

## Connect from Claude Code

Same URL as a remote HTTP MCP server with OAuth:

```bash
claude mcp add --transport http odoo-acbg "https://<odoo-host>/<random-segment>/mcp"
```

Then run `/mcp` in an interactive session to complete the OAuth sign-in. Exact path suffix comes from the Odoo settings screen. Vendor docs only describe claude.ai, so confirm the path on first connect.

## Tools

Universal, always present:

| Tool | Does | Use on this project |
|---|---|---|
| `search_records` | Query any model with a domain filter | Main tool. Products, stock, categories, orders |
| `get_model_fields` | List fields on a model | Confirm field names before locking schema |
| `get_record_url` | Direct Odoo link to a record | Hand a link to the client |
| `create_record` | Create a record, saved as draft | Not needed. Read-only project |
| `create_records_bulk` | Up to 200 records per call | Not needed |
| `copy_record` | Duplicate a record as draft | Not needed |
| `execute_action` | Confirm, cancel, validate in bulk | Not needed |
| `upload_image` | Upload an image via Odoo | Maybe later, if the client sends better photos |
| `replace_image_in_field` | Swap an image inside an HTML field | Not needed |
| `list_attachments` | List image attachments | Check which products hold larger images |
| `get_translatable_terms`, `set_translations`, `get_translation_status` | Translation workflow | Not needed |

Module-specific, present only when that Odoo app is installed:

| Tool | Needs | Use |
|---|---|---|
| `get_low_stock` | Inventory | Products under reorder point |
| `get_stock_value` | Inventory | Valuation by category |
| `get_open_orders` | Sales | Confirmed orders not yet invoiced. Check the order push landed |
| `get_top_customers` | Sales | Reporting |
| `get_overdue_invoices`, `get_upcoming_due`, `get_unpaid_bills` | Accounting | Not this project |
| `get_pending_purchases`, `get_upcoming_vendor_bills` | Purchase | Not this project |
| `get_open_leads`, `get_hot_opportunities` | CRM | Trade enquiry routing, if enquiries land in Odoo CRM |

## Queries we will actually run

- All products with reference, name, category path, list price, on-hand qty, weight, image flag. Model `product.product`, fields `default_code`, `name`, `categ_id`, `list_price`, `qty_available`, `weight`, `image_1920`.
- Stock per location. Model `stock.quant`, fields `product_id`, `location_id`, `quantity`.
- Category tree. Model `product.category`, fields `complete_name`, `parent_id`.
- Products under the "Domestic" and "MMA" branches, to confirm the exclusion rules.
- Low stock via `get_low_stock` before a sync, to decide which products get "call to confirm".

## Security

- Tokens stored as SHA-256 digests. Refresh tokens rotate on every use. A replayed token revokes the session.
- Every action runs under the signed-in user's access rights and record rules. Odoo audit trail shows the user's name. Chatter entries are internal notes.
- Removing "MCP: Can Connect" from a user revokes their tokens on next request.
- Regenerating the connector URL disconnects every session. That is the kill switch.
- Rule for this project: connect Read only. Decline Write at sign-in.

## Limits and gotchas

- Module installs code on the client's ERP. Get client IT sign-off before purchase.
- Odoo Online almost certainly cannot install it. See hosting gate.
- Rate limits still apply. Odoo Online fair use is about one request per second. Keep MCP queries small and paged.
- Tool availability depends on standard module names (`sale`, `stock`, `account`). Custom-named modules do not surface tools.
- Stale guides online describe API keys in the URL. That flow no longer exists.

## Free alternatives

- Native Odoo API with a Python tool in `tools/`. Needs only an API key for a read-only user. Works on Odoo.sh, self-hosted, and Odoo Online Custom plan. This is the runtime pipeline anyway.
- Open source MCP servers run on our side, pointed at the Odoo API: rosenvladimirov/odoo-claude-mcp, industream/mcp-odoo. Nothing to install on the client's Odoo.

## Sources

- https://apps.odoo.com/apps/modules/19.0/sadeem_mcp
- https://www.odoo.com/documentation/19.0/developer/reference/external_rpc_api.html
- https://www.odoo.com/forum/help-1/does-the-external-api-really-require-the-custom-plan-on-odoo-online-or-is-there-a-trial-window-306032
- https://github.com/rosenvladimirov/odoo-claude-mcp
