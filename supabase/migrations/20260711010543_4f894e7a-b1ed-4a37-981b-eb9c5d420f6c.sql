
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.agri_plant_kind AS ENUM ('crop','fruit_tree','vegetable','grain','herb','industrial','fodder','forest','ornamental','indoor','outdoor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agri_disease_type AS ENUM ('fungal','bacterial','viral','physiological','nutrient_deficiency','climatic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agri_pest_type AS ENUM ('insect','mite','worm','nematode','rodent','bird','mollusk','weed','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agri_treatment_target AS ENUM ('disease','pest','deficiency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agri_treatment_method AS ENUM ('chemical','biological','cultural','mechanical','organic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ HELPER ============
CREATE OR REPLACE FUNCTION public.agri_can_write() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'owner')
      OR public.has_role(auth.uid(),'manager');
$$;

-- ============ TABLES ============
CREATE TABLE public.agri_plant_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL, name_fr TEXT, name_en TEXT,
  kind public.agri_plant_kind NOT NULL,
  parent_id UUID REFERENCES public.agri_plant_categories(id) ON DELETE SET NULL,
  icon TEXT, sort INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_categories TO authenticated;
GRANT ALL ON public.agri_plant_categories TO service_role;
ALTER TABLE public.agri_plant_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_categories FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE TRIGGER trg_apc_upd BEFORE UPDATE ON public.agri_plant_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agri_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scientific_name TEXT,
  common_name_ar TEXT NOT NULL, common_name_fr TEXT, common_name_en TEXT,
  category_id UUID REFERENCES public.agri_plant_categories(id) ON DELETE SET NULL,
  family TEXT, cycle TEXT, season TEXT, climate TEXT, soil TEXT, water_needs TEXT,
  growth_stages JSONB, description TEXT, image_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plants TO authenticated;
GRANT ALL ON public.agri_plants TO service_role;
ALTER TABLE public.agri_plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plants FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_plants FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE TRIGGER trg_ap_upd BEFORE UPDATE ON public.agri_plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agri_plant_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.agri_plants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, traits JSONB, yield TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_varieties TO authenticated;
GRANT ALL ON public.agri_plant_varieties TO service_role;
ALTER TABLE public.agri_plant_varieties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_varieties FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_varieties FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE TRIGGER trg_apv_upd BEFORE UPDATE ON public.agri_plant_varieties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agri_diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL, name_fr TEXT, name_en TEXT,
  type public.agri_disease_type NOT NULL,
  scientific_name TEXT, description TEXT, symptoms TEXT,
  severity INT CHECK (severity BETWEEN 1 AND 5),
  stages JSONB, prevention TEXT, refs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_diseases TO authenticated;
GRANT ALL ON public.agri_diseases TO service_role;
ALTER TABLE public.agri_diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_diseases FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_diseases FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE TRIGGER trg_ad_upd BEFORE UPDATE ON public.agri_diseases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agri_disease_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id UUID NOT NULL REFERENCES public.agri_diseases(id) ON DELETE CASCADE,
  url TEXT NOT NULL, caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_disease_images TO authenticated;
GRANT ALL ON public.agri_disease_images TO service_role;
ALTER TABLE public.agri_disease_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_disease_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_disease_images FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

CREATE TABLE public.agri_plant_diseases (
  plant_id UUID NOT NULL REFERENCES public.agri_plants(id) ON DELETE CASCADE,
  disease_id UUID NOT NULL REFERENCES public.agri_diseases(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, disease_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_diseases TO authenticated;
GRANT ALL ON public.agri_plant_diseases TO service_role;
ALTER TABLE public.agri_plant_diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_diseases FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_diseases FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

CREATE TABLE public.agri_pests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL, name_fr TEXT, name_en TEXT,
  type public.agri_pest_type NOT NULL,
  scientific_name TEXT, description TEXT, life_cycle TEXT, damage TEXT,
  severity INT CHECK (severity BETWEEN 1 AND 5),
  image_url TEXT, refs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_pests TO authenticated;
GRANT ALL ON public.agri_pests TO service_role;
ALTER TABLE public.agri_pests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_pests FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_pests FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE TRIGGER trg_apst_upd BEFORE UPDATE ON public.agri_pests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agri_pest_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pest_id UUID NOT NULL REFERENCES public.agri_pests(id) ON DELETE CASCADE,
  url TEXT NOT NULL, caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_pest_images TO authenticated;
GRANT ALL ON public.agri_pest_images TO service_role;
ALTER TABLE public.agri_pest_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_pest_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_pest_images FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

CREATE TABLE public.agri_plant_pests (
  plant_id UUID NOT NULL REFERENCES public.agri_plants(id) ON DELETE CASCADE,
  pest_id UUID NOT NULL REFERENCES public.agri_pests(id) ON DELETE CASCADE,
  PRIMARY KEY (plant_id, pest_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_plant_pests TO authenticated;
GRANT ALL ON public.agri_plant_pests TO service_role;
ALTER TABLE public.agri_plant_pests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_plant_pests FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_plant_pests FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

CREATE TABLE public.agri_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.agri_treatment_target NOT NULL,
  target_id UUID,
  method public.agri_treatment_method NOT NULL,
  title TEXT NOT NULL, description TEXT,
  active_ingredient TEXT, dosage TEXT, frequency TEXT, safety_period TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_treatments TO authenticated;
GRANT ALL ON public.agri_treatments TO service_role;
ALTER TABLE public.agri_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_treatments FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_treatments FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());
CREATE TRIGGER trg_atr_upd BEFORE UPDATE ON public.agri_treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agri_treatment_products (
  treatment_id UUID NOT NULL REFERENCES public.agri_treatments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (treatment_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_treatment_products TO authenticated;
GRANT ALL ON public.agri_treatment_products TO service_role;
ALTER TABLE public.agri_treatment_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.agri_treatment_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "write mgmt" ON public.agri_treatment_products FOR ALL TO authenticated USING (public.agri_can_write()) WITH CHECK (public.agri_can_write());

-- ============ SEED ============
INSERT INTO public.agri_plant_categories (name_ar, name_fr, name_en, kind, sort) VALUES
  ('محاصيل حقلية','Grandes cultures','Field crops','crop',1),
  ('أشجار مثمرة','Arbres fruitiers','Fruit trees','fruit_tree',2),
  ('خضروات','Légumes','Vegetables','vegetable',3),
  ('حبوب','Céréales','Grains','grain',4),
  ('نباتات طبية وعطرية','Plantes médicinales','Medicinal & aromatic','herb',5),
  ('نباتات صناعية','Plantes industrielles','Industrial','industrial',6),
  ('أعلاف','Fourrages','Fodder','fodder',7),
  ('غابوية','Forestières','Forest','forest',8),
  ('زينة','Ornementales','Ornamental','ornamental',9);

WITH cats AS (SELECT id, kind FROM public.agri_plant_categories)
INSERT INTO public.agri_plants (scientific_name, common_name_ar, common_name_fr, common_name_en, category_id, family, cycle, season)
SELECT * FROM (VALUES
  ('Triticum aestivum','قمح','Blé','Wheat',(SELECT id FROM cats WHERE kind='grain' LIMIT 1),'Poaceae','annual','شتوي'),
  ('Hordeum vulgare','شعير','Orge','Barley',(SELECT id FROM cats WHERE kind='grain' LIMIT 1),'Poaceae','annual','شتوي'),
  ('Solanum lycopersicum','طماطم','Tomate','Tomato',(SELECT id FROM cats WHERE kind='vegetable' LIMIT 1),'Solanaceae','annual','ربيعي/صيفي'),
  ('Solanum tuberosum','بطاطس','Pomme de terre','Potato',(SELECT id FROM cats WHERE kind='vegetable' LIMIT 1),'Solanaceae','annual','ربيعي'),
  ('Olea europaea','زيتون','Olivier','Olive',(SELECT id FROM cats WHERE kind='fruit_tree' LIMIT 1),'Oleaceae','perennial','دائم'),
  ('Citrus sinensis','برتقال','Oranger','Orange',(SELECT id FROM cats WHERE kind='fruit_tree' LIMIT 1),'Rutaceae','perennial','دائم'),
  ('Phoenix dactylifera','نخيل التمر','Palmier dattier','Date palm',(SELECT id FROM cats WHERE kind='fruit_tree' LIMIT 1),'Arecaceae','perennial','دائم'),
  ('Prunus dulcis','لوز','Amandier','Almond',(SELECT id FROM cats WHERE kind='fruit_tree' LIMIT 1),'Rosaceae','perennial','دائم'),
  ('Malus domestica','تفاح','Pommier','Apple',(SELECT id FROM cats WHERE kind='fruit_tree' LIMIT 1),'Rosaceae','perennial','دائم'),
  ('Vitis vinifera','عنب','Vigne','Grape',(SELECT id FROM cats WHERE kind='fruit_tree' LIMIT 1),'Vitaceae','perennial','دائم'),
  ('Allium cepa','بصل','Oignon','Onion',(SELECT id FROM cats WHERE kind='vegetable' LIMIT 1),'Amaryllidaceae','annual','شتوي/ربيعي'),
  ('Capsicum annuum','فلفل','Poivron','Pepper',(SELECT id FROM cats WHERE kind='vegetable' LIMIT 1),'Solanaceae','annual','ربيعي/صيفي'),
  ('Daucus carota','جزر','Carotte','Carrot',(SELECT id FROM cats WHERE kind='vegetable' LIMIT 1),'Apiaceae','annual','شتوي'),
  ('Medicago sativa','فصة (البرسيم)','Luzerne','Alfalfa',(SELECT id FROM cats WHERE kind='fodder' LIMIT 1),'Fabaceae','perennial','دائم'),
  ('Mentha spicata','نعناع','Menthe','Mint',(SELECT id FROM cats WHERE kind='herb' LIMIT 1),'Lamiaceae','perennial','دائم')
) AS v;

INSERT INTO public.agri_diseases (name_ar, name_fr, name_en, type, scientific_name, symptoms, severity, prevention) VALUES
  ('اللفحة المتأخرة','Mildiou','Late blight','fungal','Phytophthora infestans','بقع بنية على الأوراق مع عفن أبيض في الأسفل',5,'دورة زراعية، تصريف جيد، مبيدات وقائية نحاسية'),
  ('البياض الدقيقي','Oïdium','Powdery mildew','fungal','Erysiphe spp.','مسحوق أبيض على الأوراق',3,'تهوية جيدة، رش كبريت'),
  ('صدأ القمح','Rouille du blé','Wheat rust','fungal','Puccinia spp.','بثرات صفراء/بنية على الأوراق',4,'أصناف مقاومة، مبيدات فطرية'),
  ('الذبول البكتيري','Flétrissement bactérien','Bacterial wilt','bacterial','Ralstonia solanacearum','ذبول مفاجئ',5,'بذور معتمدة، إتلاف النباتات المصابة'),
  ('تجعد أوراق الطماطم','TYLCV','Tomato leaf curl','viral','Begomovirus','تجعد وتقزم',4,'مكافحة الذبابة البيضاء، شبكات حماية'),
  ('نقص النيتروجين','Carence azote','Nitrogen deficiency','nutrient_deficiency',NULL,'اصفرار الأوراق السفلية',2,'تسميد متوازن');

INSERT INTO public.agri_pests (name_ar, name_fr, name_en, type, scientific_name, damage, severity) VALUES
  ('الذبابة البيضاء','Aleurode','Whitefly','insect','Bemisia tabaci','امتصاص العصارة ونقل فيروسات',4),
  ('المن','Pucerons','Aphids','insect','Aphidoidea','تشوه الأوراق ونقل الفيروسات',3),
  ('العنكبوت الأحمر','Araignée rouge','Red spider mite','mite','Tetranychus urticae','بقع صفراء على الأوراق',3),
  ('حفار ساق الذرة','Pyrale du maïs','Corn borer','insect','Ostrinia nubilalis','ثقوب في السيقان',4),
  ('نيماتودا الجذور','Nématodes','Root-knot nematode','nematode','Meloidogyne spp.','عقد على الجذور وتقزم',4),
  ('الفئران','Rats','Rats','rodent',NULL,'إتلاف المحاصيل والمخازن',3),
  ('العصافير','Oiseaux','Birds','bird',NULL,'أكل البذور والثمار',2);
