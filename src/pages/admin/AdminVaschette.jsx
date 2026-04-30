import React, { useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const emptyVaschetta = {
  nome: "",
  peso_grammi: "",
  prezzo: "",
  active: true,
  ordinamento: 0,
};

export default function AdminVaschette() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyVaschetta);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vaschette = [], isLoading } = useQuery({
    queryKey: ["admin-vaschette"],
    queryFn: () => apiClient.entities.Vaschetta.list(),
  });

  const sortedVaschette = [...vaschette].sort((a, b) => {
    const byOrder = (a.ordinamento || 0) - (b.ordinamento || 0);
    if (byOrder !== 0) return byOrder;
    return (a.peso_grammi || 0) - (b.peso_grammi || 0);
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyVaschetta);
  };

  const openEdit = (vaschetta) => {
    setEditing(vaschetta);
    setForm({
      nome: vaschetta.nome || "",
      peso_grammi: String(vaschetta.peso_grammi || ""),
      prezzo: String(vaschetta.prezzo ?? ""),
      active: vaschetta.active !== false,
      ordinamento: vaschetta.ordinamento || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      nome: form.nome.trim(),
      peso_grammi: Number(form.peso_grammi),
      prezzo: Number(form.prezzo),
      active: !!form.active,
      ordinamento: Number(form.ordinamento || 0),
    };

    if (!data.nome || !Number.isFinite(data.peso_grammi) || !Number.isFinite(data.prezzo)) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci nome, peso e prezzo validi.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      if (editing) await apiClient.entities.Vaschetta.update(editing.id, data);
      else await apiClient.entities.Vaschetta.create(data);
      await queryClient.invalidateQueries({ queryKey: ["admin-vaschette"] });
      closeDialog();
    } catch (error) {
      toast({
        title: editing ? "Errore aggiornamento" : "Errore creazione",
        description: error.message || "Operazione non riuscita",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await apiClient.entities.Vaschetta.delete(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-vaschette"] });
    } catch (error) {
      toast({
        title: "Errore eliminazione",
        description: error.message || "Operazione non riuscita",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Gestione Vaschette</h1>
          <p className="text-muted-foreground text-sm mt-1">{sortedVaschette.length} vaschette</p>
        </div>
        <Button onClick={() => { setForm(emptyVaschetta); setDialogOpen(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Nuova Vaschetta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedVaschette.map((v) => (
            <div key={v.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{v.nome}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {v.peso_grammi}g - EUR {Number(v.prezzo || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${v.active ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {v.active ? "Attiva" : "Disattiva"}
                </span>
                <Button size="icon" variant="ghost" onClick={() => openEdit(v)} className="h-8 w-8">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="h-8 w-8" disabled={deletingId === v.id}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="">
            <DialogTitle className="font-heading">{editing ? "Modifica Vaschetta" : "Nuova Vaschetta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="">Nome *</Label>
              <Input className="" type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Es. Media" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="">Peso (g) *</Label>
                <Input className="" type="number" min={1} value={form.peso_grammi} onChange={(e) => setForm({ ...form, peso_grammi: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="">Prezzo (EUR) *</Label>
                <Input className="" type="number" min={0} step="0.01" value={form.prezzo} onChange={(e) => setForm({ ...form, prezzo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="">Ordinamento</Label>
              <Input className="" type="number" value={form.ordinamento} onChange={(e) => setForm({ ...form, ordinamento: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="">Attiva</Label>
              <Switch className="" checked={!!form.active} onCheckedChange={(value) => setForm({ ...form, active: value })} />
            </div>
            <Button type="submit" className="w-full rounded-lg" disabled={saving}>
              {editing ? "Salva Modifiche" : "Aggiungi Vaschetta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
