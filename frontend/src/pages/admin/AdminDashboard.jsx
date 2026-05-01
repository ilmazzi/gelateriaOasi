import React from "react";
import { apiClient } from "@/api/apiClient.js";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IceCreamCone, Tag, ShoppingBag, Image, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: gelati = [] } = useQuery({
    queryKey: ["admin-gelati"],
    queryFn: () => apiClient.entities.Gelato.list(),
  });

  const { data: promozioni = [] } = useQuery({
    queryKey: ["admin-promo"],
    queryFn: () => apiClient.entities.Promozione.list(),
  });

  const { data: prenotazioni = [] } = useQuery({
    queryKey: ["admin-prenotazioni"],
    queryFn: () => apiClient.entities.Prenotazione.list("-created_date", 50),
  });

  const { data: foto = [] } = useQuery({
    queryKey: ["admin-foto"],
    queryFn: () => apiClient.entities.FotoGalleria.list(),
  });

  const inAttesa = prenotazioni.filter((p) => p.stato === "in_attesa").length;

  const stats = [
    { label: "Gusti Attivi", value: gelati.filter((g) => g.disponibile !== false).length, icon: IceCreamCone, color: "text-primary" },
    { label: "Promozioni Attive", value: promozioni.filter((p) => p.attiva !== false).length, icon: Tag, color: "text-accent" },
    { label: "Prenotazioni in Attesa", value: inAttesa, icon: ShoppingBag, color: "text-chart-4" },
    { label: "Foto Galleria", value: foto.length, icon: Image, color: "text-chart-3" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Panoramica della tua gelateria</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Ultime Prenotazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prenotazioni.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nessuna prenotazione ricevuta.</p>
          ) : (
            <div className="space-y-3">
              {prenotazioni.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{p.nome_cliente}</p>
                    <p className="text-xs text-muted-foreground">{p.gusti} — {p.taglia}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{p.data_ritiro} alle {p.ora_ritiro}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.stato === "in_attesa" ? "bg-accent/20 text-accent-foreground" :
                      p.stato === "confermata" ? "bg-primary/10 text-primary" :
                      p.stato === "pronta" ? "bg-chart-3/20 text-chart-3" :
                      p.stato === "ritirata" ? "bg-muted text-muted-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {p.stato?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}