import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, RefreshCw, Crosshair } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon paths for bundlers
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export const Route = createFileRoute("/_authenticated/fleet/tracking")({ component: TrackingPage });

function TrackingPage() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  async function load() {
    const { data } = await supabase.from("fleet_vehicles").select("*").not("last_lat","is",null).not("last_lng","is",null);
    setVehicles(data ?? []);
  }
  useEffect(() => {
    load();
    const ch = supabase.channel("fleet_gps").on("postgres_changes", { event: "INSERT", schema: "public", table: "fleet_gps_positions" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function pushPosition() {
    if (!selected || !manualLat || !manualLng) { toast.error(t("common.fillAll")); return; }
    const { error } = await supabase.from("fleet_gps_positions").insert({
      vehicle_id: selected, lat: Number(manualLat), lng: Number(manualLng),
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved"));
    setManualLat(""); setManualLng("");
    load();
  }

  function useGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => { setManualLat(String(p.coords.latitude)); setManualLng(String(p.coords.longitude)); });
  }

  const center: [number, number] = vehicles[0]
    ? [Number(vehicles[0].last_lat), Number(vehicles[0].last_lng)]
    : [31.7917, -7.0926]; // Morocco center

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><MapPin className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.tracking")}</h1></div>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 me-1" />{t("common.refresh") || "تحديث"}</Button>
      </div>

      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="text-sm font-medium mb-2">{t("fleet.gpsNote")}</div>
        <div className="grid gap-2 md:grid-cols-5 md:items-end">
          <div>
            <Label>{t("fleet.vehicle")}</Label>
            <select className="w-full h-9 rounded border bg-background px-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">—</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </div>
          <div><Label>{t("reps.lat")}</Label><Input value={manualLat} onChange={(e) => setManualLat(e.target.value)} /></div>
          <div><Label>{t("reps.lng")}</Label><Input value={manualLng} onChange={(e) => setManualLng(e.target.value)} /></div>
          <Button variant="outline" onClick={useGeo}><Crosshair className="h-4 w-4 me-1" />GPS</Button>
          <Button onClick={pushPosition}>{t("fleet.updatePosition")}</Button>
        </div>
      </Card>

      <Card className="overflow-hidden" style={{ height: 500 }}>
        <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {vehicles.map((v) => (
            <Marker key={v.id} position={[Number(v.last_lat), Number(v.last_lng)]} icon={icon}>
              <Popup>
                <div className="font-bold">{v.plate}</div>
                <div>{v.name}</div>
                <div className="text-xs text-muted-foreground">{v.last_ping_at ? new Date(v.last_ping_at).toLocaleString() : ""}</div>
                {v.last_speed && <div>Speed: {v.last_speed} km/h</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>
    </div>
  );
}
