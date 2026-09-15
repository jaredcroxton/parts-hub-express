# Part Hub Express: Open Questions for ACBG

Trimmed after reading the audit, the proposal and the Odoo export. Answered questions removed. Ordered by what blocks work soonest.

## Blocks parcel one

1. Which option: Open for Business, or Open + Finished?
2. Company and bank details for the payment gateway. Who sends them and when?
3. Who is the sign-off for design and content?
4. Does anyone still have the previous developer's Shopify login, or do we revoke on sight?
5. Who hosts your email? The support@ address bounces until the domain has mail set up.
5a. The store currently runs on partshubexpresscom.com (typo). Do we move it to partshubexpress.com and redirect the old one? Assume yes unless told otherwise.

## Blocks the catalogue work

6. Can you re-export from Odoo with these extra columns: sale price, quantity on hand, weight, sales description, and the full-size image field (image_1920 rather than image_128)? Weight matters most: only 4 of 277 Shopify products have one, and shipping cannot be re-rated without it.
6a. If weights are mostly empty in Odoo, would you accept a default weight per category (one number each for Manganese, Rollers, Fasteners and so on, about 14 in total) that we apply in bulk, with real weights overriding where they exist?
6b. The full-size image export will be large, likely hundreds of megabytes. Can you export in category batches, or export a file with just ID and image, or give us a login so we can pull images by URL from Odoo directly?
7. What does the "Domestic" category branch mean? 814 products sit under it, mirroring the main tree.
8. The "MMA / Maximus Machinery - Pronar" branch has 326 products. Exclude from Parts Hub Express?
9. Around 300 products have a different code at the start of the name than the internal reference (for example ref 0116-0010, name "0116-0003 Pressure Filter"). Is that the OEM number, an old code, or a superseded part? If it is an old or superseded code, we can make it searchable and redirect old links automatically.
9a. Two products have no internal reference and one reference is used twice. Can you fix those three in Odoo? The reference becomes the product's web address and SKU, so it has to be unique.
10. Is the goal the 277 products already in Shopify, or the full 5,702 in Odoo? Changes the parcel two scope.
11. Where does machine-to-part fitment live: Odoo, a spreadsheet, or in someone's head? Model numbers appear in product names (HP300, C160, ST 45, J1175). Is that reliable enough to build a "shop by machine" filter from?
12. Do full-size product photos exist anywhere outside Odoo? 251 of the 277 live products show a grey "no image" placeholder.
13. The "Manufactured Drawings" category has 126 products. Are there drawings or exploded diagrams we could show?
14. Who processes orders once they come in, and where should trade enquiries land: an inbox, Odoo CRM, or both?

## Shapes the shipping re-rate

15. Do parts ship from one location or several?
16. Freight carriers used, pickup option, and how oversized manganese and roller items ship today?
17. Which Odoo edition and plan: Odoo Online, Odoo.sh, or self-hosted? Which version? Decides whether API access is even possible later.
17a. Would you install a small paid module (Sadeem MCP, about USD 25) on your Odoo so we can read live stock and product data through Claude? Only possible on Odoo.sh or self-hosted. If not, an Odoo API key for a read-only user gives us the same data without installing anything.
17b. Can you create a read-only Odoo user for Managed Digital, with access to Inventory and Products? Needed for either route.
18. How often can you send a refreshed export: weekly, monthly?

## Nice to know

19. Any competitor or reference site you like the feel of?
20. Do terms, refund and shipping policies exist in any form, or do we draft from scratch?
