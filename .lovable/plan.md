# Phase 5 — Agricultural Knowledge Base

Adds a new independent module on top of the existing system. No existing table, page, module, or logic is touched.

## 1) New database tables (all with GRANT + RLS + updated_at trigger)

**Reference / taxonomy**
- `agri_plant_categories` — name_ar/fr/en, kind (`crop|fruit_tree|vegetable|grain|herb|industrial|fodder|forest|ornamental|indoor|outdoor`), parent_id, icon, sort
- `agri_plants` — scientific_name, common_name_ar/fr/en, category_id, family, cycle (annual/perennial), season, climate, soil, water_needs, growth_stages (jsonb), description, image_url, is_active
- `agri_plant_varieties` — plant_id, name, traits (jsonb), yield, notes

**Diseases**
- `agri_diseases` — name_ar/fr/en, type (`fungal|bacterial|viral|physiological|nutrient_deficiency|climatic`), scientific_name, description, symptoms, severity (1–5), stages (jsonb), prevention, references (jsonb)
- `agri_disease_images` — disease_id, url, caption
- `agri_plant_diseases` — plant_id, disease_id (many-to-many)

**Pests**
- `agri_pests` — name_ar/fr/en, type (`insect|mite|worm|nematode|rodent|bird|mollusk|weed|other`), scientific_name, description, life_cycle, damage, severity, image_url, references (jsonb)
- `agri_pest_images` — pest_id, url, caption
- `agri_plant_pests` — plant_id, pest_id

**Treatments / recommendations**
- `agri_treatments` — target_type (`disease|pest|deficiency`), target_id, method (`chemical|biological|cultural|mechanical|organic`), title, description, active_ingredient, dosage, frequency, safety_period, notes
- `agri_treatment_products` — treatment_id, product_id (link to existing `products` when the shop sells it) — optional catalog bridge

All tables:
- `GRANT SELECT` to `authenticated` (public catalog read).
- `GRANT INSERT/UPDATE/DELETE` to `authenticated` gated by RLS to roles `admin`, `owner`, `manager`, `agronomist` (new role added to `app_role` enum if missing? — no enum change: reuse `admin`/`owner`/`manager`).
- `GRANT ALL` to `service_role`.
- `updated_at` trigger reusing existing `public.update_updated_at_column()`.

## 2) New pages (under `_authenticated`)

- `/agri` — hub with 4 cards (Plants, Diseases, Pests, Treatments)
- `/agri/plants` — list + filter by category/kind + search AR/FR/EN + detail drawer (varieties, linked diseases, linked pests, growth stages)
- `/agri/diseases` — list + filter by type/severity + detail (symptoms, images, prevention, treatments, affected plants)
- `/agri/pests` — same shape as diseases
- `/agri/treatments` — list filtered by target, link to shop products

All pages: CRUD dialogs for admins; read-only cards for others. Images uploaded to a new **private** Storage bucket `agri-images` (signed URLs on read).

## 3) i18n
Add keys under `agri.*` in `src/lib/i18n.tsx` (AR/FR/EN).

## 4) Modules registry
Append `agri` group in `src/lib/modules.ts` so the sidebar shows the new section automatically. No existing entry removed.

## 5) Seed data (optional, small starter set)
A migration seeds ~15 common Moroccan crops (wheat, barley, tomato, potato, olive, citrus, date palm, almond, apple, grape, onion, pepper, carrot, alfalfa, mint) with a handful of well-known diseases/pests each, so the pages aren't empty. Users can add/edit freely.

## 6) Safety
- No `DROP`, no `ALTER` on existing tables.
- No changes to existing RLS, functions, or triggers except adding new ones scoped to new tables.
- New storage bucket only.

## 7) Testing after build
- Create/edit/delete plant, disease, pest, treatment as admin.
- Search AR/FR/EN.
- Link disease to plant, pest to plant, treatment to disease.
- Upload image, view via signed URL.
- Verify existing pages (POS, sales, inventory, users…) still work unchanged.

Shall I proceed with this scope, or trim/expand any part first?
