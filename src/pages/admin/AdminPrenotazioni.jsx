import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash2, Phone, Mail, Calendar, Clock, ShoppingBag } from "lucide-react";

const statoLabels = {
  in_attesa: "In Attesa",
  confermata: "Confermata",
  pronta: "Pronta",
  ritirata: "Ritirata",
  annullata: "Annullata",
};

const statoColors = {
  in_attesa: "bg-accent/20 text-accent-foreground border-accent/30",
  confermata: "bg-primary/10 text-primary border-primary/20",
  pronta: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  ritirata: "bg-muted text-muted-foreground border-border",
  annullata: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminPrenotazioni() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: prenotazioni = [], isLoading } = useQuery({
    queryKey: ["admin-prenotazioni"],
    queryFn: () => base44.entities.Prenotazione.list("-created_date", 100),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, stato }) => base44.entities.Prenotazione.update(id, { stato }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-prenotazioni"] }),
    onError: (error) => {
      toast({ title: "Errore aggiornamento stato", description: error.message || "Verifica ruolo admin/policy", variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Prenotazione.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-prenotazioni"] }),
    onError: (error) => {
      toast({ title: "Errore eliminazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Prenotazioni</h1>
        <p className="text-muted-foreground text-sm mt-1">{prenotazioni.length} prenotazioni</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : prenotazioni.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nessuna prenotazione ricevuta.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {prenotazioni.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">{p.nome_cliente}</h3>
                      <Badge className={`${statoColors[p.stato || "in_attesa"]} border text-xs`}>
                        {statoLabels[p.stato || "in_attesa"]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {p.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {p.telefono}
                        </span>
                      )}
                      {p.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {p.email}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> {p.data_ritiro}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /> {p.ora_ritiro}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Gusti:</span> {p.gusti}
                      {p.taglia && <span className="ml-2 text-muted-foreground">({p.taglia})</span>}
                      {p.quantita > 1 && <span className="ml-1 text-muted-foreground">x{p.quantita}</span>}
                    </div>

                    {p.note && (
                      <p className="text-sm text-muted-foreground italic">"{p.note}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isMobile ? (
                      <NativeSelect
                        className="w-36 text-xs"
                        value={p.stato || "in_attesa"}
                        onChange={(event) => updateMut.mutate({ id: p.id, stato: event.target.value })}
                      >
                        {Object.entries(statoLabels).map(([k, v]) => (
                          <NativeSelectOption key={k} value={k}>
                            {v}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    ) : (
                      <Select
                        value={p.stato || "in_attesa"}
                        onValueChange={(v) => updateMut.mutate({ id: p.id, stato: v })}
                      >
                        <SelectTrigger className="w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statoLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}