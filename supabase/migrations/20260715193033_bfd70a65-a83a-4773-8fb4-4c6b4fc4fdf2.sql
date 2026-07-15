
-- ============================================================
-- Wave 1: Agricultural Knowledge System — Schema Expansion
-- ============================================================

-- 1) FERTILIZERS
CREATE TABLE public.agri_fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.current_org_id(),
  name_ar text NOT NULL,
  name_fr text,
  name_en text,
  brand text,
  manufacturer text,
  type text, -- npk, urea, dap, mop, compound, organic, foliar, liquid, granular, bio
  n_percent numeric(6,2),
  p_percent numeric(6,2),
  k_percent numeric(6,2),
  micro_nutrients text,        -- Ca, Mg, S, Fe, Zn, B ...
  composition text,
  dosage text,                 -- e.g. "5 kg/ha at planting"
  application_method text,     -- soil, foliar, fertigation
  suitable_crops text,         -- comma-separated / free-text; also linkage table below
  suitable_stages text,        -- germination/vegetative/flowering/fruiting
  ph_effect text,
  cautions text,
  image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  references_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_fertilizers TO authenticated;
GRANT ALL ON public.agri_fertilizers TO service_role;
ALTER TABLE public.agri_fertilizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_fertilizers FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_fertilizers FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE POLICY "tenant_isolation" ON public.agri_fertilizers FOR ALL
  USING (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id())
  WITH CHECK (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id());
CREATE TRIGGER trg_agri_fertilizers_updated BEFORE UPDATE ON public.agri_fertilizers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) PESTICIDES
CREATE TABLE public.agri_pesticides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.current_org_id(),
  name_ar text NOT NULL,
  name_fr text,
  name_en text,
  trade_name text,
  active_ingredient text NOT NULL,
  concentration text,              -- e.g. "50% EC"
  formulation text,                -- EC, WP, SC, SL, WG, SG
  manufacturer text,
  category text,                   -- insecticide, fungicide, herbicide, acaricide, nematicide, rodenticide, bactericide, biological
  mode_of_action text,
  toxicity_class text,             -- I/II/III/IV (WHO)
  target_pests text,               -- names / comma-separated (also link table)
  target_diseases text,
  target_weeds text,
  dosage text,                     -- e.g. "0.5 L/ha"
  application_method text,
  pre_harvest_interval_days integer,
  re_entry_interval_hours integer,
  suitable_crops text,
  alternatives text,               -- alternative products/actives
  cautions text,
  image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  references_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_pesticides TO authenticated;
GRANT ALL ON public.agri_pesticides TO service_role;
ALTER TABLE public.agri_pesticides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_pesticides FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_pesticides FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE POLICY "tenant_isolation" ON public.agri_pesticides FOR ALL
  USING (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id())
  WITH CHECK (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id());
CREATE TRIGGER trg_agri_pesticides_updated BEFORE UPDATE ON public.agri_pesticides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) SEEDS
CREATE TABLE public.agri_seeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.current_org_id(),
  variety_name text NOT NULL,
  crop_name text NOT NULL,           -- for search convenience
  plant_id uuid REFERENCES public.agri_plants(id) ON DELETE SET NULL,
  company text,
  country_of_origin text,
  seed_type text,                    -- hybrid F1, open-pollinated, GMO, heirloom, treated
  planting_season text,
  planting_method text,              -- direct seeding, transplant, broadcast
  density text,                      -- e.g. "40x50 cm, 25000 plants/ha"
  germination_rate_percent numeric(5,2),
  purity_percent numeric(5,2),
  cycle_days integer,                -- days to harvest
  expected_yield text,               -- e.g. "60 t/ha"
  disease_resistance text,
  climate_zones text,
  packaging_size text,
  description text,
  image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_seeds TO authenticated;
GRANT ALL ON public.agri_seeds TO service_role;
ALTER TABLE public.agri_seeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_seeds FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_seeds FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE POLICY "tenant_isolation" ON public.agri_seeds FOR ALL
  USING (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id())
  WITH CHECK (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id());
CREATE TRIGGER trg_agri_seeds_updated BEFORE UPDATE ON public.agri_seeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) WEEDS
CREATE TABLE public.agri_weeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.current_org_id(),
  name_ar text NOT NULL,
  name_fr text,
  name_en text,
  scientific_name text,
  family text,
  weed_type text,                    -- annual, perennial, grass, broadleaf, sedge
  life_cycle text,
  description text,
  identification text,               -- how to recognize
  affected_crops text,               -- comma-separated / free-text
  damage text,
  control_cultural text,
  control_mechanical text,
  control_chemical text,             -- herbicides / active ingredients
  control_biological text,
  image_url text,
  references_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_weeds TO authenticated;
GRANT ALL ON public.agri_weeds TO service_role;
ALTER TABLE public.agri_weeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_weeds FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_weeds FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE POLICY "tenant_isolation" ON public.agri_weeds FOR ALL
  USING (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id())
  WITH CHECK (public.is_system_owner(auth.uid()) OR organization_id IS NULL OR organization_id = public.current_org_id());
CREATE TRIGGER trg_agri_weeds_updated BEFORE UPDATE ON public.agri_weeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) LINK TABLES (crop ↔ fertilizer / pesticide / weed)
CREATE TABLE public.agri_plant_fertilizers (
  plant_id uuid NOT NULL REFERENCES public.agri_plants(id) ON DELETE CASCADE,
  fertilizer_id uuid NOT NULL REFERENCES public.agri_fertilizers(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, fertilizer_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_fertilizers TO authenticated;
GRANT ALL ON public.agri_plant_fertilizers TO service_role;
ALTER TABLE public.agri_plant_fertilizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_fertilizers FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_fertilizers FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

CREATE TABLE public.agri_plant_pesticides (
  plant_id uuid NOT NULL REFERENCES public.agri_plants(id) ON DELETE CASCADE,
  pesticide_id uuid NOT NULL REFERENCES public.agri_pesticides(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, pesticide_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_pesticides TO authenticated;
GRANT ALL ON public.agri_plant_pesticides TO service_role;
ALTER TABLE public.agri_plant_pesticides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_pesticides FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_pesticides FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

CREATE TABLE public.agri_plant_weeds (
  plant_id uuid NOT NULL REFERENCES public.agri_plants(id) ON DELETE CASCADE,
  weed_id uuid NOT NULL REFERENCES public.agri_weeds(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, weed_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_weeds TO authenticated;
GRANT ALL ON public.agri_plant_weeds TO service_role;
ALTER TABLE public.agri_plant_weeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_weeds FOR SELECT USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_weeds FOR ALL USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

-- 6) AI CONVERSATIONS (chat history for /ai)
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.current_org_id(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conv read" ON public.ai_conversations FOR SELECT
  USING (user_id = auth.uid() OR public.is_system_owner(auth.uid()));
CREATE POLICY "own conv write" ON public.ai_conversations FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tenant_isolation" ON public.ai_conversations FOR ALL
  USING (public.is_system_owner(auth.uid()) OR organization_id = public.current_org_id())
  WITH CHECK (public.is_system_owner(auth.uid()) OR organization_id = public.current_org_id());
CREATE TRIGGER trg_ai_conversations_updated BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL DEFAULT public.current_org_id(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  role text NOT NULL,                -- 'user' | 'assistant' | 'system'
  content text NOT NULL,
  image_url text,
  suggestions jsonb,                 -- structured suggestions (products, programs)
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg read" ON public.ai_messages FOR SELECT
  USING (user_id = auth.uid() OR public.is_system_owner(auth.uid()));
CREATE POLICY "own msg write" ON public.ai_messages FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tenant_isolation" ON public.ai_messages FOR ALL
  USING (public.is_system_owner(auth.uid()) OR organization_id = public.current_org_id())
  WITH CHECK (public.is_system_owner(auth.uid()) OR organization_id = public.current_org_id());

-- 7) INDEXES for search performance
CREATE INDEX idx_agri_fertilizers_name ON public.agri_fertilizers USING gin (to_tsvector('simple', coalesce(name_ar,'') || ' ' || coalesce(name_fr,'') || ' ' || coalesce(name_en,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(manufacturer,'')));
CREATE INDEX idx_agri_pesticides_name ON public.agri_pesticides USING gin (to_tsvector('simple', coalesce(name_ar,'') || ' ' || coalesce(name_fr,'') || ' ' || coalesce(trade_name,'') || ' ' || coalesce(active_ingredient,'') || ' ' || coalesce(manufacturer,'')));
CREATE INDEX idx_agri_seeds_name ON public.agri_seeds USING gin (to_tsvector('simple', coalesce(variety_name,'') || ' ' || coalesce(crop_name,'') || ' ' || coalesce(company,'')));
CREATE INDEX idx_agri_weeds_name ON public.agri_weeds USING gin (to_tsvector('simple', coalesce(name_ar,'') || ' ' || coalesce(name_fr,'') || ' ' || coalesce(scientific_name,'')));
CREATE INDEX idx_agri_fertilizers_org ON public.agri_fertilizers(organization_id);
CREATE INDEX idx_agri_pesticides_org ON public.agri_pesticides(organization_id);
CREATE INDEX idx_agri_seeds_org ON public.agri_seeds(organization_id);
CREATE INDEX idx_agri_weeds_org ON public.agri_weeds(organization_id);
CREATE INDEX idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at);
