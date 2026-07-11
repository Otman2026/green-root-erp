
CREATE TABLE public.fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  name text,
  vtype text NOT NULL DEFAULT 'car',
  make text, model text, year int,
  color text,
  vin text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  odometer numeric NOT NULL DEFAULT 0,
  fuel_type text,
  gps_device_id text,
  last_lat numeric, last_lng numeric, last_speed numeric, last_ping_at timestamptz,
  insurance_expiry date, license_expiry date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_vehicles TO authenticated;
GRANT ALL ON public.fleet_vehicles TO service_role;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fv_read" ON public.fleet_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "fv_write" ON public.fleet_vehicles FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_fv_upd BEFORE UPDATE ON public.fleet_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fleet_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  phone text,
  license_no text,
  license_expiry date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_drivers TO authenticated;
GRANT ALL ON public.fleet_drivers TO service_role;
ALTER TABLE public.fleet_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fd_read" ON public.fleet_drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "fd_write" ON public.fleet_drivers FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_fd_upd BEFORE UPDATE ON public.fleet_drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fleet_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.fleet_drivers(id) ON DELETE SET NULL,
  trip_date date NOT NULL DEFAULT CURRENT_DATE,
  start_time timestamptz, end_time timestamptz,
  from_location text, to_location text,
  start_odometer numeric, end_odometer numeric,
  distance numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  purpose text,
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_trips TO authenticated;
GRANT ALL ON public.fleet_trips TO service_role;
ALTER TABLE public.fleet_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ft_read" ON public.fleet_trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "ft_write" ON public.fleet_trips FOR ALL TO authenticated USING (public.acc_can_write() OR public.has_role(auth.uid(),'delivery')) WITH CHECK (public.acc_can_write() OR public.has_role(auth.uid(),'delivery'));
CREATE TRIGGER trg_ft_upd BEFORE UPDATE ON public.fleet_trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fleet_fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.fleet_drivers(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  liters numeric NOT NULL DEFAULT 0,
  price_per_liter numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  odometer numeric,
  station text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_fuel_logs TO authenticated;
GRANT ALL ON public.fleet_fuel_logs TO service_role;
ALTER TABLE public.fleet_fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ff_read" ON public.fleet_fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "ff_write" ON public.fleet_fuel_logs FOR ALL TO authenticated USING (public.acc_can_write() OR public.has_role(auth.uid(),'delivery')) WITH CHECK (public.acc_can_write() OR public.has_role(auth.uid(),'delivery'));
CREATE TRIGGER trg_ff_upd BEFORE UPDATE ON public.fleet_fuel_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fleet_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  mtype text NOT NULL DEFAULT 'routine',
  description text,
  cost numeric NOT NULL DEFAULT 0,
  odometer numeric,
  next_service_date date,
  next_service_odometer numeric,
  vendor text,
  status text NOT NULL DEFAULT 'done',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_maintenance TO authenticated;
GRANT ALL ON public.fleet_maintenance TO service_role;
ALTER TABLE public.fleet_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fm_read" ON public.fleet_maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "fm_write" ON public.fleet_maintenance FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_fm_upd BEFORE UPDATE ON public.fleet_maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fleet_gps_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  speed numeric,
  heading numeric,
  ping_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gps_vehicle_time ON public.fleet_gps_positions(vehicle_id, ping_at DESC);
GRANT SELECT, INSERT ON public.fleet_gps_positions TO authenticated;
GRANT ALL ON public.fleet_gps_positions TO service_role;
ALTER TABLE public.fleet_gps_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gps_read" ON public.fleet_gps_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "gps_write" ON public.fleet_gps_positions FOR INSERT TO authenticated WITH CHECK (public.acc_can_write() OR public.has_role(auth.uid(),'delivery'));

-- Update last known GPS on vehicle when a new position arrives
CREATE OR REPLACE FUNCTION public.update_vehicle_last_gps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.fleet_vehicles
    SET last_lat = NEW.lat, last_lng = NEW.lng, last_speed = NEW.speed, last_ping_at = NEW.ping_at
    WHERE id = NEW.vehicle_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_gps_last AFTER INSERT ON public.fleet_gps_positions FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_last_gps();
