import React, { useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, IceCreamCone } from "lucide-react";

const emptyGelato = {
  nome: "", descrizione: "", foto: "", prezzo_piccolo: "", prezzo_medio: "", prezzo_grande: "",
  categoria: "classico", in_evidenza: false, disponibile: true, allergeni: "",
};

export default function AdminGelati() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGelato);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gelati = [], isLoading } = useQuery({
    queryKey: ["admin-gelati"],
    queryFn: () => apiClient.entities.Gelato.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => apiClient.entities.Gelato.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-gelati"] }); closeDialog(); },
    onError: (error) => {
      toast({ title: "Errore creazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Gelato.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-gelati"] }); closeDialog(); },
    onError: (error) => {
      toast({ title: "Errore aggiornamento", description: error.message || "Verifica ruolo admin/policy", variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.Gelato.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-gelati"] }),
    onError: (error) => {
      toast({ title: "Errore eliminazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyGelato); };

  const openEdit = (g) => {
    setEditing(g);
    setForm({
      nome: g.nome || "", descrizione: g.descrizione || "", foto: g.foto || "",
      prezzo_piccolo: g.prezzo_piccolo || "", prezzo_medio: g.prezzo_medio || "",
      prezzo_grande: g.prezzo_grande || "", categoria: g.categoria || "classico",
      in_evidenza: g.in_evidenza || false, disponibile: g.disponibile !== false,
      allergeni: g.allergeni || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      prezzo_piccolo: form.prezzo_piccolo ? Number(form.prezzo_piccolo) : null,
      prezzo_medio: form.prezzo_medio ? Number(form.prezzo_medio) : null,
      prezzo_grande: form.prezzo_grande ? Number(form.prezzo_grande) : null,
    };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, foto: file_url }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Gestione Gelati</h1>
          <p className="text-muted-foreground text-sm mt-1">{gelati.length} gusti</p>
        </div>
        <Button onClick={() => { setForm(emptyGelato); setDialogOpen(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Nuovo Gusto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {gelati.map((g) => (
            <div key={g.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {g.foto ? (
                  <img src={g.foto} alt={g.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IceCreamCone className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{g.nome}</p>
                  {g.in_evidenza && <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent-foreground rounded">★</span>}
                  {g.disponibile === false && <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">Non disp.</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{g.categoria}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(g)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(g.id)}>
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
            <DialogTitle className="font-heading">{editing ? "Modifica Gusto" : "Nuovo Gusto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Foto</Label>
              <Input type="file" accept="image/*" onChange={handleFoto} />
              {form.foto && <img src={form.foto} alt="" className="w-20 h-20 rounded-lg object-cover mt-2" />}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Prezzo P (€)</Label>
                <Input type="number" step="0.01" value={form.prezzo_piccolo} onChange={(e) => setForm({ ...form, prezzo_piccolo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prezzo M (€)</Label>
                <Input type="number" step="0.01" value={form.prezzo_medio} onChange={(e) => setForm({ ...form, prezzo_medio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prezzo G (€)</Label>
                <Input type="number" step="0.01" value={form.prezzo_grande} onChange={(e) => setForm({ ...form, prezzo_grande: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classico">Classico</SelectItem>
                  <SelectItem value="frutta">Frutta</SelectItem>
                  <SelectItem value="speciale">Speciale</SelectItem>
                  <SelectItem value="vegano">Vegano</SelectItem>
                  <SelectItem value="senza_zucchero">Senza Zucchero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Allergeni</Label>
              <Input value={form.allergeni} onChange={(e) => setForm({ ...form, allergeni: e.target.value })} placeholder="Latte, nocciole..." />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.in_evidenza} onCheckedChange={(v) => setForm({ ...form, in_evidenza: v })} />
                <Label>In Evidenza</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.disponibile} onCheckedChange={(v) => setForm({ ...form, disponibile: v })} />
                <Label>Disponibile</Label>
              </div>
            </div>
            <Button type="submit" className="w-full rounded-lg" disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Salva Modifiche" : "Aggiungi Gusto"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}