import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const emptyNegozio = {
  nome: "",
  descrizione: "",
  foto: "",
  indirizzo: "",
  telefono: "",
  email: "",
  orari: "",
};

export default function AdminNegozio() {
  const [form, setForm] = useState(emptyNegozio);
  const [recordId, setRecordId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: negozio = [], isLoading } = useQuery({
    queryKey: ["admin-negozio"],
    queryFn: () => apiClient.entities.Negozio.list(),
  });

  useEffect(() => {
    const current = negozio?.[0];
    if (!current) {
      setRecordId(null);
      setForm(emptyNegozio);
      return;
    }

    setRecordId(current.id);
    setForm({
      nome: current.nome || "",
      descrizione: current.descrizione || "",
      foto: current.foto || "",
      indirizzo: current.indirizzo || "",
      telefono: current.telefono || "",
      email: current.email || "",
      orari: current.orari || "",
    });
  }, [negozio]);

  const createMut = useMutation({
    mutationFn: () => apiClient.entities.Negozio.create({
      nome: form.nome.trim(),
      descrizione: form.descrizione.trim(),
      foto: form.foto.trim(),
      indirizzo: form.indirizzo.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      orari: form.orari.trim(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-negozio"] });
      toast({ title: "Negozio creato", description: "Dati salvati correttamente." });
    },
    onError: (error) => {
      toast({
        title: "Errore creazione",
        description: error.message || "Impossibile creare i dati del negozio.",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!recordId) throw new Error("Record negozio non trovato");
      return apiClient.entities.Negozio.update(recordId, {
        nome: form.nome.trim(),
        descrizione: form.descrizione.trim(),
        foto: form.foto.trim(),
        indirizzo: form.indirizzo.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        orari: form.orari.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-negozio"] });
      toast({ title: "Negozio aggiornato", description: "Dati aggiornati con successo." });
    },
    onError: (error) => {
      toast({
        title: "Errore aggiornamento",
        description: error.message || "Impossibile aggiornare i dati del negozio.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({
        title: "Nome obbligatorio",
        description: "Inserisci il nome del negozio.",
        variant: "destructive",
      });
      return;
    }

    if (recordId) {
      updateMut.mutate();
    } else {
      createMut.mutate();
    }
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
      setForm((prev) => ({ ...prev, foto: file_url }));
    } catch (error) {
      toast({
        title: "Errore upload",
        description: error.message || "Caricamento immagine non riuscito.",
        variant: "destructive",
      });
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Gestione Negozio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aggiorna qui le informazioni principali della tua gelateria.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading">Dati negozio</CardTitle>
          <CardDescription className="text-sm">
            Questi dati possono essere riutilizzati nelle pagine pubbliche (footer, contatti, home).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Nome *</Label>
              <Input
                type="text"
                className="rounded-lg"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Bar Gelateria L'Oasi"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Descrizione</Label>
              <Textarea
                className="rounded-lg"
                value={form.descrizione}
                onChange={(e) => setForm((prev) => ({ ...prev, descrizione: e.target.value }))}
                placeholder="Breve descrizione del negozio..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Foto copertina</Label>
              <Input className="rounded-lg" type="file" accept="image/*" onChange={handleFoto} />
              {form.foto ? (
                <img src={form.foto} alt="Anteprima negozio" className="w-32 h-32 rounded-lg object-cover mt-2" />
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Indirizzo</Label>
                <Input
                  type="text"
                  className="rounded-lg"
                  value={form.indirizzo}
                  onChange={(e) => setForm((prev) => ({ ...prev, indirizzo: e.target.value }))}
                  placeholder="Via A. Manzoni 16, Valmadrera"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Telefono</Label>
                <Input
                  type="text"
                  className="rounded-lg"
                  value={form.telefono}
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+39 0341 580332"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input
                  type="email"
                  className="rounded-lg"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="info@gelateriaoasi.it"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Orari</Label>
                <Input
                  type="text"
                  className="rounded-lg"
                  value={form.orari}
                  onChange={(e) => setForm((prev) => ({ ...prev, orari: e.target.value }))}
                  placeholder="Lun - Dom: 10:00 - 23:00"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="rounded-lg">
              {isSaving ? "Salvataggio..." : recordId ? "Salva modifiche" : "Crea dati negozio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}