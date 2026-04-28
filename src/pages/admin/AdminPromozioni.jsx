import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

const emptyPromo = {
  titolo: "", descrizione: "", foto: "", data_inizio: "", data_fine: "",
  sconto_percentuale: "", attiva: true,
};

export default function AdminPromozioni() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPromo);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: promozioni = [], isLoading } = useQuery({
    queryKey: ["admin-promo"],
    queryFn: () => base44.entities.Promozione.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Promozione.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promo"] }); closeDialog(); },
    onError: (error) => {
      toast({ title: "Errore creazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Promozione.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promo"] }); closeDialog(); },
    onError: (error) => {
      toast({ title: "Errore aggiornamento", description: error.message || "Verifica ruolo admin/policy", variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Promozione.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promo"] }),
    onError: (error) => {
      toast({ title: "Errore eliminazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyPromo); };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      titolo: p.titolo || "", descrizione: p.descrizione || "", foto: p.foto || "",
      data_inizio: p.data_inizio || "", data_fine: p.data_fine || "",
      sconto_percentuale: p.sconto_percentuale || "", attiva: p.attiva !== false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, sconto_percentuale: form.sconto_percentuale ? Number(form.sconto_percentuale) : null };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, foto: file_url }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Gestione Promozioni</h1>
          <p className="text-muted-foreground text-sm mt-1">{promozioni.length} promozioni</p>
        </div>
        <Button onClick={() => { setForm(emptyPromo); setDialogOpen(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Nuova Promo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {promozioni.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {p.foto ? (
                  <img src={p.foto} alt={p.titolo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{p.titolo}</p>
                  {p.sconto_percentuale && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">-{p.sconto_percentuale}%</span>}
                </div>
                <p className="text-xs text-muted-foreground">{p.attiva !== false ? "Attiva" : "Non attiva"}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Modifica Promozione" : "Nuova Promozione"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Titolo *</Label>
              <Input value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Immagine</Label>
              <Input type="file" accept="image/*" onChange={handleFoto} />
              {form.foto && <img src={form.foto} alt="" className="w-20 h-20 rounded-lg object-cover mt-2" />}
            </div>
            <div className="space-y-2">
              <Label>Sconto %</Label>
              <Input type="number" value={form.sconto_percentuale} onChange={(e) => setForm({ ...form, sconto_percentuale: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input type="date" value={form.data_inizio} onChange={(e) => setForm({ ...form, data_inizio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data Fine</Label>
                <Input type="date" value={form.data_fine} onChange={(e) => setForm({ ...form, data_fine: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.attiva} onCheckedChange={(v) => setForm({ ...form, attiva: v })} />
              <Label>Attiva</Label>
            </div>
            <Button type="submit" className="w-full rounded-lg" disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salva" : "Crea Promozione"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}