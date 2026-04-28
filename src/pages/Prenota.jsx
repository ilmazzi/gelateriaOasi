import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle, Clock, ShoppingBag, Info } from "lucide-react";

const orari = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"
];

const initialForm = {
  nome_cliente: "",
  telefono: "",
  email: "",
  data_ritiro: "",
  ora_ritiro: "",
  gusti: "",
  taglia: "media",
  quantita: 1,
  note: "",
};

export default function Prenota() {
  const [form, setForm] = useState(initialForm);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: gelati = [] } = useQuery({
    queryKey: ["gelati-disponibili"],
    queryFn: () => base44.entities.Gelato.filter({ disponibile: true }),
  });

  const mutation = useMutation({
    mutationFn: () => base44.entities.Prenotazione.create(form),
    onSuccess: () => {
      setSuccess(true);
      setForm(initialForm);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error?.message || "Si è verificato un errore. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome_cliente || !form.telefono || !form.data_ritiro || !form.ora_ritiro || !form.gusti) {
      toast({ title: "Campi obbligatori", description: "Compila tutti i campi obbligatori.", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const today = new Date().toISOString().split("T")[0];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3">Prenotazione Inviata!</h2>
          <p className="text-muted-foreground font-body mb-6">
            La tua prenotazione è stata ricevuta. Ti contatteremo per la conferma.
          </p>
          <Button onClick={() => setSuccess(false)} className="rounded-full px-8 font-body">
            Nuova Prenotazione
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Prenota il tuo Gelato</h1>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Ordina in anticipo e ritira senza attesa.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Dettagli Prenotazione</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Nome *</Label>
                <Input
                  type="text"
                  value={form.nome_cliente}
                  onChange={(e) => handleChange("nome_cliente", e.target.value)}
                  placeholder="Mario Rossi"
                  className="rounded-lg font-body"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Telefono *</Label>
                <Input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="+39 333 1234567"
                  className="rounded-lg font-body"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="mario@email.com"
                className="rounded-lg font-body"
              />
            </div>

            <div className="flex items-center gap-3 pb-2 pt-2 border-b border-border">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Data e Ora Ritiro</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Data Ritiro *</Label>
                <Input
                  type="date"
                  min={today}
                  value={form.data_ritiro}
                  onChange={(e) => handleChange("data_ritiro", e.target.value)}
                  className="rounded-lg font-body"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Ora Ritiro *</Label>
                {isMobile ? (
                  <NativeSelect
                    className="w-full rounded-lg font-body"
                    value={form.ora_ritiro}
                    onChange={(e) => handleChange("ora_ritiro", e.target.value)}
                  >
                    <NativeSelectOption className="" value="">Seleziona orario</NativeSelectOption>
                    {orari.map((o) => (
                      <NativeSelectOption className="" key={o} value={o}>
                        {o}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : (
                  <Select value={form.ora_ritiro} onValueChange={(v) => handleChange("ora_ritiro", v)}>
                    <SelectTrigger className="rounded-lg font-body">
                      <SelectValue placeholder="Seleziona orario" />
                    </SelectTrigger>
                    <SelectContent className="">
                      {orari.map((o) => (
                        <SelectItem className="" key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pb-2 pt-2 border-b border-border">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Il tuo Ordine</h2>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Gusti Desiderati *</Label>
              {gelati.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {gelati.map((g) => {
                    const selected = form.gusti.includes(g.nome);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => {
                          const current = form.gusti ? form.gusti.split(", ").filter(Boolean) : [];
                          const updated = selected
                            ? current.filter((n) => n !== g.nome)
                            : [...current, g.nome];
                          handleChange("gusti", updated.join(", "));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-body transition-all border ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {g.nome}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  type="text"
                  value={form.gusti}
                  onChange={(e) => handleChange("gusti", e.target.value)}
                  placeholder="Es. Pistacchio, Cioccolato, Fragola"
                  className="rounded-lg font-body"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Dimensione Vaschetta</Label>
                {isMobile ? (
                  <NativeSelect
                    className="w-full rounded-lg font-body"
                    value={form.taglia}
                    onChange={(e) => handleChange("taglia", e.target.value)}
                  >
                    <NativeSelectOption className="" value="piccola">Piccola</NativeSelectOption>
                    <NativeSelectOption className="" value="media">Media</NativeSelectOption>
                    <NativeSelectOption className="" value="grande">Grande</NativeSelectOption>
                  </NativeSelect>
                ) : (
                  <Select value={form.taglia} onValueChange={(v) => handleChange("taglia", v)}>
                    <SelectTrigger className="rounded-lg font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem className="" value="piccola">Piccola</SelectItem>
                      <SelectItem className="" value="media">Media</SelectItem>
                      <SelectItem className="" value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {/* Tooltip dimensioni */}
                <div className="flex items-start gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2.5 mt-1">
                  <Info className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground font-body space-y-0.5">
                    <p><span className="font-semibold text-foreground">Piccola</span> — circa 500g · ideale per 2 persone</p>
                    <p><span className="font-semibold text-foreground">Media</span> — circa 1 kg · ideale per 4 persone</p>
                    <p><span className="font-semibold text-foreground">Grande</span> — circa 2 kg · ideale per 6–8 persone</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Quantità</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.quantita}
                  onChange={(e) => handleChange("quantita", parseInt(e.target.value) || 1)}
                  className="rounded-lg font-body"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Note</Label>
              <Textarea
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                placeholder="Allergie, richieste speciali..."
                className="rounded-lg font-body"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full font-body"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Invio in corso..." : "Invia Prenotazione"}
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}