# WhatsApp + n8n integration (TRI-MATSYA FastAPI)

This backend is webhook-ready for WhatsApp and n8n. Use **n8n as the orchestration layer** for WhatsApp flows (recommended), or connect Meta WhatsApp directly to this app.

## 1) Configure environment
Edit `backend/.env` (see `.env.example`):

```env
# Optional: let TRI-MATSYA reply/send via WhatsApp Cloud API directly
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=your-meta-verify-token
WHATSAPP_CONTACT_NUMBER=

# n8n integration
N8N_WEBHOOK_URL=https://<your-n8n-host>/webhook/tri-matsya-events   # TRI-MATSYA -> n8n (outbound events)
N8N_WEBHOOK_SECRET=shared-secret                                      # n8n -> TRI-MATSYA auth (header)
```

Run FastAPI (SPA + API): 
```bash
cd backend
DATABASE_URL='sqlite:///./data/trimatsya.db' uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Expose publicly for webhooks (ngrok/cloudflared/reverse proxy), e.g. `https://api.example.com`.

## 2) Endpoints

| Direction | Endpoint | Purpose |
|---|---|---|
| Meta/n8n -> App | `GET/POST /webhooks/whatsapp` (or `/api/webhooks/whatsapp`) | Meta webhook verification (`hub.*`) and inbound WhatsApp messages (Meta or simple payload). Parses and can auto-create catch listings for registered fishermen. |
| n8n -> App | `POST /webhooks/n8n` (or `/api/webhooks/n8n`) | Command endpoint for n8n workflows to create/update records. If `N8N_WEBHOOK_SECRET` is set, send header `X-N8N-Webhook-Secret: <secret>`. |
| App -> n8n | `N8N_WEBHOOK_URL` | App POSTs platform events (best-effort) to n8n when configured. |
| Info | `GET /api/integrations` | Shows webhook URLs/config status. |

## 3) Recommended n8n workflow (WhatsApp via n8n)

**Inbound (fisherman sends WhatsApp message -> listing created):**
1. **Trigger**: `WhatsApp Trigger` (Meta Cloud API) or `Webhook` node receiving Meta callbacks.
2. **Extract**: phone (`from`), message text/caption, image (optional).
3. **(Optional) AI/parse** in n8n to normalize species/quantity/condition/location/language.
4. **HTTP Request -> TRI-MATSYA**: `POST https://<api>/webhooks/n8n`
   - Headers: `Content-Type: application/json`, `X-N8N-Webhook-Secret: <shared-secret>`
   - Body examples:

Create fresh catch listing (matched by fisherman phone):
```json
{
  "action": "create_catch_listing",
  "phone": "919448010001",
  "species": "Sardines",
  "quantity_kg": 25,
  "condition": "Fresh",
  "landing_location": "Mangaluru Harbour",
  "notes": "Created from WhatsApp via n8n",
  "imageUrl": "https://..."
}
```

Create waste listing (inspection-required):
```json
{
  "action": "create_waste_listing",
  "phone": "919448010001",
  "material_type": "Fish trimmings",
  "species_name": "Mixed",
  "category": "fishmeal",
  "quantity_kg": 40,
  "collection_location": "Mangaluru Harbour",
  "notes": "From WhatsApp via n8n"
}
```

Update order status:
```json
{ "action": "update_order_status", "order_id": 123, "status": "In transit" }
```

Health check: `{ "action": "ping" }`

5. **Reply**: use n8n `WhatsApp`/HTTP node to send confirmation (or let TRI-MATSYA reply if `WHATSAPP_TOKEN`+`WHATSAPP_PHONE_NUMBER_ID` are set).

**Outbound (platform event -> WhatsApp/automation):**
1. **Trigger**: `Webhook` node; set its URL as `N8N_WEBHOOK_URL` in `.env`.
2. TRI-MATSYA will POST events like:
   - `whatsapp.listing_created` (from direct WhatsApp webhook)
   - `catch.listing_created`, `waste.listing_created`, `waste.request_created`
   - `order.created`, `order.status_updated`
   Payload shape: `{ "event": "<name>", "source": "tri-matsya", "data": { ... } }`
3. **Route/notify**: send WhatsApp updates to fisherman/buyer/processor, log, update sheets, etc.

## 4) Direct Meta -> TRI-MATSYA (alternative)
- Point Meta WhatsApp webhook to `https://<api>/webhooks/whatsapp` and set `WHATSAPP_VERIFY_TOKEN` for GET verification.
- POST accepts Meta message structure or simple `{ "phone": "...", "message": "50 kg Bangude fresh", "imageBase64"/"imageUrl": "..." }`.
- Auto-creates a **pending-verification** catch listing for registered fishermen (matched by phone); asks to register if unknown. Replies via WhatsApp Cloud API if credentials are configured.

## 5) Notes
- Phone matching uses last 10 digits against registered user phones; ensure fishermen register with correct mobile numbers.
- Waste materials are created as **non-food-grade / inspection-required** and are never mixed into the fresh marketplace.
- Event emission to n8n is best-effort (won't fail core actions if n8n is down/unset).
- For production, use PostgreSQL, HTTPS, real WhatsApp credentials, and keep `N8N_WEBHOOK_SECRET`/tokens private.
