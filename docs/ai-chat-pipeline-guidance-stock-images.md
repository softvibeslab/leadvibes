# AI chat, pipeline guidance and stock-image templates

## Summary

This change set upgrades the LeadVibes assistant from a generic chat helper into a CRM-aware assistant that can answer deterministic lead/pipeline questions quickly, suggest non-invasive next actions, and generate email/campaign assets with visual previews.

The implementation keeps local Ollama as the primary AI provider for normal tasks and uses OpenAI as fallback/premium routing. It also adds structured cards and action chips so the frontend can render real UI instead of parsing Markdown.

## Main changes

### AI routing

- Added configurable provider routing in `backend/ai_service.py`.
- Default provider is local Ollama using `llama3.2:3b`.
- OpenAI remains available as fallback through the existing Emergent integration.
- Added task-specific Ollama model variables for chat, analysis and script generation.
- Tightened assistant response style:
  - Spanish Mexican tone.
  - Maximum of 3 bullets or 3 short sentences.
  - No repeated greetings after the conversation starts.
  - Ask one concrete follow-up question.

### Deterministic chat flows

- Added backend helpers in `backend/server.py` for deterministic CRM prompts such as lead detail, action chips, pipeline step details and campaign/asset suggestions.
- Avoids sending common CRM prompts through the LLM when the lead and action can be resolved directly.
- Keeps response payloads structured with `cards`, `actions` and related metadata.
- Adds controlled timeout behavior for generic AI paths so the frontend does not wait indefinitely.

### Pipeline cards and action chips

- Lead-detail responses now include structured pipeline cards:
  - Current stage.
  - Suggested next step.
  - Optional funnel/flow idea.
- Default lead-detail suggestions are intentionally soft and non-invasive.
- Default suggestions are limited to about 3 chips and avoid object-creating actions unless the user explicitly asks to create a funnel, campaign, asset or pipeline.
- WhatsApp actions use official `wa.me` click-to-chat URLs with normalized digits-only phone numbers and encoded message text.

### Campaign and email-template visuals

- Added reusable stock images in `frontend/src/lib/emailStockImages.js`.
- Added backend stock-image helpers to select fallback images by lead/property interest.
- AI-created email template assets now include editor-compatible `json_content.blocks`, `html_content` and thumbnail image data so templates do not open blank in the visual editor.
- Campaign/template cards now prefer a real thumbnail, then an HTML preview fallback, then a placeholder.

### Frontend chat UX

- Updated `frontend/src/components/AIChat.js` to render richer structured cards and action chips.
- Preserves non-destructive behavior: failures are shown as chat feedback instead of breaking the panel.
- Updated `frontend/src/pages/DatabaseChatPage.js` for the adjusted chat experience.

### Email editor

- Updated `frontend/src/pages/EmailEditorPage.js` with a stock-image picker for image/property blocks.
- Users can choose base images directly from the editor sidebar.

### Docker/dev environment

- Updated Compose configuration for the active LeadVibes dev stack.
- Added an Ollama proxy service so Docker containers can reach host Ollama without exposing Ollama publicly.
- Dev ports used by this stack:
  - Frontend: `13000`
  - Backend: `18080`
  - MongoDB: `27027`

## Important behavior notes

- The assistant should not create CRM objects by default from lead-detail suggestions.
- Object creation should happen only after explicit user intent, for example asking to create an asset, campaign, funnel or pipeline flow.
- Email-template assets must always keep `json_content.blocks` and `html_content` aligned.
- Channel chips should only be shown when the tenant/module and lead data support the action.

## Validation

Targeted backend tests were added/updated for:

- AI provider routing and fallback behavior.
- Lead chat cards, action chips and soft suggestion behavior.
- Stock-image inclusion in generated email/template assets.

Recommended verification commands:

```bash
docker exec leadvibes-dev-backend pytest backend/tests/test_ai_service_routing.py backend/tests/test_lead_chat_cards.py -q

docker compose -p leadvibes-dev -f docker-compose.yml -f docker-compose.dev.yml build backend frontend

docker compose -p leadvibes-dev -f docker-compose.yml -f docker-compose.dev.yml up -d backend frontend
```

Manual smoke test:

1. Open the dev frontend.
2. Login with the demo broker account.
3. Ask: `Detalle del lead Isabella Torres`.
4. Confirm the assistant shows concise pipeline cards and only soft chips by default.
5. Open campaign/template screens and verify thumbnails/previews render.
6. Open the email editor and verify stock images can be selected for image/property blocks.
