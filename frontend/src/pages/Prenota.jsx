import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/apiClient.js";
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
  tipo_ordine: "gelati",
  gusti: "",
  panini_items: [],
  vaschetta_id: "",
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
    queryFn: () => apiClient.entities.Gelato.filter({ disponibile: true }),
  });

  const { data: panini = [] } = useQuery({
    queryKey: ["panini-disponibili"],
    queryFn: () => apiClient.entities.Panino.filter({ disponibile: true }),
  });

  const { data: vaschette = [] } = useQuery({
    queryKey: ["vaschette-disponibili"],
    queryFn: () => apiClient.entities.Vaschetta.filter({ active: true }),
  });

  const sortedVaschette = useMemo(
    () =>
      [...vaschette].sort((a, b) => {
        const byOrder = (a.ordinamento || 0) - (b.ordinamento || 0);
        if (byOrder !== 0) return byOrder;
        return (a.peso_grammi || 0) - (b.peso_grammi || 0);
      }),
    [vaschette],
  );

  const selectedVaschetta = useMemo(
    () => sortedVaschette.find((v) => String(v.id) === String(form.vaschetta_id)),
    [sortedVaschette, form.vaschetta_id],
  );

  const paniniTotal = useMemo(() => {
    const priceById = new Map(panini.map((p) => [String(p.id), Number(p.prezzo || 0)]));
    return form.panini_items.reduce((sum, item) => {
      const unitPrice = priceById.get(String(item.id)) || 0;
      return sum + unitPrice * Number(item.quantita || 0);
    }, 0);
  }, [form.panini_items, panini]);

  const gelatiTotal = useMemo(() => {
    const needsGelati = form.tipo_ordine === "gelati" || form.tipo_ordine === "entrambi";
    if (!needsGelati || !selectedVaschetta) return 0;
    return Number(selectedVaschetta.prezzo || 0) * Number(form.quantita || 0);
  }, [form.tipo_ordine, selectedVaschetta, form.quantita]);

  const orderTotal = gelatiTotal + paniniTotal;

  const mutation = useMutation({
    mutationFn: () => {
      const paniniDetails = form.panini_items
        .map((item) => `${item.nome} x${item.quantita}${item.note ? ` (${item.note})` : ""}`)
        .join(", ");
      const tipoLabel =
        form.tipo_ordine === "panini"
          ? "Panini"
          : form.tipo_ordine === "entrambi"
            ? "Gelati + Panini"
            : "Gelati";
      const orderDetails =
        form.tipo_ordine === "panini"
          ? `Panini: ${paniniDetails}`
          : form.tipo_ordine === "entrambi"
            ? `Gelati: ${form.gusti} | Panini: ${paniniDetails}`
            : form.gusti;

      const vaschettaLabel = selectedVaschetta
        ? `${selectedVaschetta.nome} (${selectedVaschetta.peso_grammi}g)`
        : "";

      const bookingPayload = {
        nome_cliente: form.nome_cliente,
        telefono: form.telefono,
        email: form.email,
        data_ritiro: form.data_ritiro,
        ora_ritiro: form.ora_ritiro,
        gusti: orderDetails,
        taglia: vaschettaLabel || null,
        quantita: form.quantita,
        note: [form.note, `Tipo ordine: ${tipoLabel}`, `Totale stimato: EUR ${orderTotal.toFixed(2)}`].filter(Boolean).join("\n"),
      };

      return apiClient.entities.Prenotazione.create(bookingPayload);
    },
    onSuccess: (data) => {
      setSuccess(true);
      setForm(initialForm);
      if (data?._bookingEmailsSent === false) {
        toast({
          title: "Prenotazione registrata",
          description:
            data?._bookingEmailsError ||
            "Non abbiamo potuto inviare le email di conferma; ti contatteremo comunque.",
          variant: "destructive",
        });
      }
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
    const needsGelati = form.tipo_ordine === "gelati" || form.tipo_ordine === "entrambi";
    const needsPanini = form.tipo_ordine === "panini" || form.tipo_ordine === "entrambi";

    if (
      !form.nome_cliente ||
      !form.telefono ||
      !form.data_ritiro ||
      !form.ora_ritiro ||
      (needsGelati && !form.gusti) ||
      (needsGelati && !form.vaschetta_id) ||
      (needsPanini && form.panini_items.length === 0)
    ) {
      toast({ title: "Campi obbligatori", description: "Compila tutti i campi obbligatori.", variant: "destructive" });
      return;
    }

    const currentDate = new Date();
    const isToday = isSameLocalDate(form.data_ritiro, currentDate);

    if (isToday && form.ora_ritiro) {
      const selectedMinutes = toMinutes(form.ora_ritiro);
      const nowMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

      if (selectedMinutes <= nowMinutes) {
        toast({
          title: "Orario non valido",
          description: "Per oggi scegli un orario successivo a quello attuale.",
          variant: "destructive",
        });
        return;
      }
    }

    mutation.mutate();
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toMinutes = (time) => {
    const [hours, minutes] = String(time || "0:0").split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const isSameLocalDate = (dateStr, referenceDate) => {
    if (!dateStr) return false;
    const [year, month, day] = dateStr.split("-").map(Number);
    return (
      year === referenceDate.getFullYear() &&
      month === referenceDate.getMonth() + 1 &&
      day === referenceDate.getDate()
    );
  };

  const availableOrari = useMemo(() => {
    if (!form.data_ritiro) return orari;

    const now = new Date();
    if (!isSameLocalDate(form.data_ritiro, now)) return orari;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return orari.filter((time) => toMinutes(time) > nowMinutes);
  }, [form.data_ritiro]);

  useEffect(() => {
    if (!form.ora_ritiro) return;
    if (!availableOrari.includes(form.ora_ritiro)) {
      setForm((prev) => ({ ...prev, ora_ritiro: "" }));
    }
  }, [availableOrari, form.ora_ritiro]);

  useEffect(() => {
    if (!sortedVaschette.length) return;
    setForm((prev) => {
      if (prev.vaschetta_id) return prev;
      return { ...prev, vaschetta_id: String(sortedVaschette[0].id) };
    });
  }, [sortedVaschette]);

  const togglePaninoSelection = (panino) => {
    setForm((prev) => {
      const exists = prev.panini_items.some((item) => item.id === panino.id);
      if (exists) {
        return {
          ...prev,
          panini_items: prev.panini_items.filter((item) => item.id !== panino.id),
        };
      }
      return {
        ...prev,
        panini_items: [...prev.panini_items, { id: panino.id, nome: panino.nome, quantita: 1, note: "" }],
      };
    });
  };

  const updatePaninoItem = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      panini_items: prev.panini_items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
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
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Prenota il tuo Ordine</h1>
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
                      <NativeSelectOption
                        className=""
                        key={o}
                        value={o}
                        disabled={!availableOrari.includes(o)}
                      >
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
                        <SelectItem className="" key={o} value={o} disabled={!availableOrari.includes(o)}>
                          {o}
                        </SelectItem>
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
              <Label className="font-body text-sm">Cosa vuoi ordinare? *</Label>
              {isMobile ? (
                <NativeSelect
                  className="w-full rounded-lg font-body"
                  value={form.tipo_ordine}
                  onChange={(e) => handleChange("tipo_ordine", e.target.value)}
                >
                  <NativeSelectOption className="" value="gelati">Solo gelati</NativeSelectOption>
                  <NativeSelectOption className="" value="panini">Solo panini</NativeSelectOption>
                  <NativeSelectOption className="" value="entrambi">Gelati + panini</NativeSelectOption>
                </NativeSelect>
              ) : (
                <Select value={form.tipo_ordine} onValueChange={(v) => handleChange("tipo_ordine", v)}>
                  <SelectTrigger className="rounded-lg font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectItem className="" value="gelati">Solo gelati</SelectItem>
                    <SelectItem className="" value="panini">Solo panini</SelectItem>
                    <SelectItem className="" value="entrambi">Gelati + panini</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {(form.tipo_ordine === "gelati" || form.tipo_ordine === "entrambi") && (
              <div className="space-y-2">
                <Label className="font-body text-sm">Gusti Gelato *</Label>
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
            )}

            {(form.tipo_ordine === "panini" || form.tipo_ordine === "entrambi") && (
              <div className="space-y-2">
                <Label className="font-body text-sm">Panini Desiderati *</Label>
                {panini.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {panini.map((p) => {
                      const selected = form.panini_items.some((item) => item.id === p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePaninoSelection(p)}
                          className={`px-3 py-1.5 rounded-full text-sm font-body transition-all border ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          {p.nome}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    type="text"
                    value=""
                    onChange={() => {}}
                    placeholder="Es. Toast prosciutto e formaggio, Panino tonno"
                    className="rounded-lg font-body"
                    disabled
                  />
                )}
                {form.panini_items.length > 0 && (
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    {form.panini_items.map((item) => (
                      <div key={item.id} className="space-y-2 rounded-md bg-secondary/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">{item.nome}</p>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Qta</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={item.quantita}
                              onChange={(e) => updatePaninoItem(item.id, "quantita", Math.max(1, parseInt(e.target.value, 10) || 1))}
                              className="h-8 w-20 rounded-md"
                            />
                          </div>
                        </div>
                        <Textarea
                          value={item.note}
                          onChange={(e) => updatePaninoItem(item.id, "note", e.target.value)}
                          placeholder="Modifiche ingredienti (es. senza pomodoro, extra formaggio)"
                          className="rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(form.tipo_ordine === "gelati" || form.tipo_ordine === "entrambi") && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Vaschette disponibili</p>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {sortedVaschette.length > 0 ? (
                    sortedVaschette.map((v) => (
                      <p key={v.id}>
                        <span className="font-medium text-foreground">{v.nome}</span>
                        {" - "}
                        {v.peso_grammi}g - EUR {Number(v.prezzo || 0).toFixed(2)}
                      </p>
                    ))
                  ) : (
                    <p>Nessuna vaschetta attiva disponibile al momento.</p>
                  )}
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 ${form.tipo_ordine === "panini" ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
              {form.tipo_ordine !== "panini" && (
                <div className="space-y-2">
                <Label className="font-body text-sm">Vaschetta *</Label>
                {isMobile ? (
                  <NativeSelect
                    className="w-full rounded-lg font-body"
                    value={form.vaschetta_id}
                    onChange={(e) => handleChange("vaschetta_id", e.target.value)}
                  >
                    <NativeSelectOption className="" value="">Seleziona vaschetta</NativeSelectOption>
                    {sortedVaschette.map((v) => (
                      <NativeSelectOption className="" key={v.id} value={String(v.id)}>
                        {v.nome} - {v.peso_grammi}g - EUR {Number(v.prezzo || 0).toFixed(2)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                ) : (
                  <Select value={form.vaschetta_id} onValueChange={(v) => handleChange("vaschetta_id", v)}>
                    <SelectTrigger className="rounded-lg font-body">
                      <SelectValue placeholder="Seleziona vaschetta" />
                    </SelectTrigger>
                    <SelectContent className="">
                      {sortedVaschette.map((v) => (
                        <SelectItem className="" key={v.id} value={String(v.id)}>
                          {v.nome} - {v.peso_grammi}g - EUR {Number(v.prezzo || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              )}
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

            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
              <h3 className="font-medium">Totale ordine (stimato)</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {(form.tipo_ordine === "gelati" || form.tipo_ordine === "entrambi") && (
                  <p>
                    Gelati: EUR {gelatiTotal.toFixed(2)}
                    {selectedVaschetta ? ` (${selectedVaschetta.nome} x${form.quantita})` : ""}
                  </p>
                )}
                {(form.tipo_ordine === "panini" || form.tipo_ordine === "entrambi") && (
                  <p>Panini: EUR {paniniTotal.toFixed(2)}</p>
                )}
              </div>
              <p className="text-lg font-semibold">Totale: EUR {orderTotal.toFixed(2)}</p>
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