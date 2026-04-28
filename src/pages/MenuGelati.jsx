import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import GelatoCard from "@/components/public/GelatoCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categorie = [
  { value: "tutti", label: "Tutti" },
  { value: "classico", label: "Classici" },
  { value: "frutta", label: "Frutta" },
  { value: "speciale", label: "Speciali" },
  { value: "vegano", label: "Vegano" },
  { value: "senza_zucchero", label: "Senza Zucchero" },
];

export default function MenuGelati() {
  const [categoria, setCategoria] = useState("tutti");

  const { data: gelati = [], isLoading } = useQuery({
    queryKey: ["gelati"],
    queryFn: () => base44.entities.Gelato.filter({ disponibile: true }),
  });

  const filtered = categoria === "tutti"
    ? gelati
    : gelati.filter((g) => g.categoria === categoria);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">I Nostri Gusti</h1>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Gelato artigianale preparato ogni giorno con ingredienti selezionati.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <Tabs value={categoria} onValueChange={setCategoria}>
            <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
              {categorie.map((c) => (
                <TabsTrigger
                  key={c.value}
                  value={c.value}
                  className="rounded-full px-4 text-sm font-body"
                >
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body">Nessun gusto trovato in questa categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((gelato, i) => (
                <GelatoCard key={gelato.id} gelato={gelato} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}