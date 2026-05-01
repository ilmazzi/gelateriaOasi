import React, { useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Star, Image } from "lucide-react";

export default function AdminFoto() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titolo: "", foto_url: "", descrizione: "", in_evidenza: false });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: foto = [], isLoading } = useQuery({
    queryKey: ["admin-foto"],
    queryFn: () => apiClient.entities.FotoGalleria.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => apiClient.entities.FotoGalleria.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-foto"] });
      setDialogOpen(false);
      setForm({ titolo: "", foto_url: "", descrizione: "", in_evidenza: false });
    },
    onError: (error) => {
      toast({ title: "Errore creazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.FotoGalleria.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-foto"] }),
    onError: (error) => {
      toast({ title: "Errore eliminazione", description: error.message || "Operazione non riuscita", variant: "destructive" });
    },
  });

  const toggleEvidenza = useMutation({
    mutationFn: ({ id, val }) => apiClient.entities.FotoGalleria.update(id, { in_evidenza: val }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-foto"] }),
    onError: (error) => {
      toast({ title: "Errore aggiornamento", description: error.message || "Verifica ruolo admin/policy", variant: "destructive" });
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, foto_url: file_url }));
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Galleria Foto</h1>
          <p className="text-muted-foreground text-sm mt-1">{foto.length} foto</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Aggiungi Foto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : foto.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nessuna foto caricata.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {foto.map((f) => (
            <div key={f.id} className="relative group rounded-xl overflow-hidden aspect-square bg-secondary">
              <img src={f.foto_url} alt={f.titolo || ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => toggleEvidenza.mutate({ id: f.id, val: !f.in_evidenza })}
                  className="rounded-full"
                >
                  <Star className={`w-4 h-4 ${f.in_evidenza ? "fill-accent text-accent" : ""}`} />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => deleteMut.mutate(f.id)} className="rounded-full">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {f.in_evidenza && (
                <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-1">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Aggiungi Foto</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Foto *</Label>
              <Input type="file" accept="image/*" onChange={handleUpload} />
              {uploading && <p className="text-xs text-muted-foreground">Caricamento...</p>}
              {form.foto_url && <img src={form.foto_url} alt="" className="w-20 h-20 rounded-lg object-cover mt-2" />}
            </div>
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Input value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.in_evidenza} onCheckedChange={(v) => setForm({ ...form, in_evidenza: v })} />
              <Label>Mostra in Homepage</Label>
            </div>
            <Button type="submit" className="w-full rounded-lg" disabled={!form.foto_url || createMut.isPending}>
              Aggiungi
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}