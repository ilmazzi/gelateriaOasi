import React, { useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

const emptyCategoria = {
  name: "",
  product_type_id: "",
  active: true,
};

export default function AdminCategorie() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCategoria);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categorie = [], isLoading } = useQuery({
    queryKey: ["admin-categorie"],
    queryFn: () => apiClient.entities.Categoria.list(),
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ["admin-product-types"],
    queryFn: () => apiClient.entities.TipoProdotto.list(),
  });

  const productTypeById = new Map(
    productTypes.map((pt) => [String(pt.id), pt.type || String(pt.id)])
  );

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyCategoria);
  };

  const openEdit = (categoria) => {
    setEditing(categoria);
    setForm({
      name: categoria.name || "",
      product_type_id: String(categoria.product_type_id || ""),
      active: categoria.active !== false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.trim(),
      product_type_id: form.product_type_id ? Number(form.product_type_id) : null,
      active: !!form.active,
    };

    if (!data.name || !data.product_type_id) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci nome categoria e tipo prodotto.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      if (editing) await apiClient.entities.Categoria.update(editing.id, data);
      else await apiClient.entities.Categoria.create(data);
      await queryClient.invalidateQueries({ queryKey: ["admin-categorie"] });
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
      await apiClient.entities.Categoria.delete(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-categorie"] });
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
          <h1 className="font-heading text-2xl font-bold">Gestione Categorie</h1>
          <p className="text-muted-foreground text-sm mt-1">{categorie.length} categorie</p>
        </div>
        <Button onClick={() => { setForm(emptyCategoria); setDialogOpen(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Nuova Categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {categorie.map((c) => (
            <div key={c.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                <Tag className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.name || c.name_it || "-"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Tipo: {productTypeById.get(String(c.product_type_id)) || c.product_type_id || "-"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.active ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {c.active ? "Attiva" : "Disattiva"}
                </span>
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)} className="h-8 w-8">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="h-8 w-8" disabled={deletingId === c.id}>
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
            <DialogTitle className="font-heading">{editing ? "Modifica Categoria" : "Nuova Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="">Nome categoria *</Label>
              <Input
                className=""
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es. Classici"
              />
            </div>

            <div className="space-y-2">
              <Label className="">Tipo prodotto *</Label>
              <Select
                value={form.product_type_id}
                onValueChange={(value) => setForm({ ...form, product_type_id: value })}
              >
                <SelectTrigger className="">
                  <SelectValue placeholder="Seleziona tipo prodotto" />
                </SelectTrigger>
                <SelectContent className="">
                  {productTypes.map((pt) => (
                    <SelectItem className="" key={pt.id} value={String(pt.id)}>
                      {pt.type || pt.name || `Tipo ${pt.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="">Attiva</Label>
              <Switch
                className=""
                checked={!!form.active}
                onCheckedChange={(value) => setForm({ ...form, active: value })}
              />
            </div>

            <Button type="submit" className="w-full rounded-lg" disabled={saving}>
              {editing ? "Salva Modifiche" : "Aggiungi Categoria"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}