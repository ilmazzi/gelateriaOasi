import React, { useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import GelatoCard from "@/components/public/GelatoCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";



export default function MenuGelati() {

  const { data: gelati = [], isLoading } = useQuery({
    queryKey: ["gelati"],
    queryFn: () => apiClient.entities.Gelato.filter({ disponibile: true }),
  });

  const [categoria, setCategoria] = useState("tutti");
  const { data: categorie = [] } = useQuery({
    queryKey: ["categorie-gelati"],
    queryFn: () => apiClient.entities.Categoria.categoryByProductType("Gelati"),
  });


  const categorieTabs = [
    { value: "tutti", label: "Tutti" },
    ...categorie
      .map((c) => {
        const value = c.id;
        const label = c.label || c.name || c.name_it || c.value || c.slug;
        if (!value || !label) return null;
        return { value: String(value).trim(), label: String(label).trim() };
      })
      .filter(Boolean),
  ];
  const categorieById = new Map(
    categorie.map((c) => [String(c.id), c.name_it || c.name || c.label || ""])
  );

  const getCategoriaLabel = (gelato) => {
    const categoriaRaw = String(gelato.categoria ?? gelato.categoria_id ?? "");
    return categorieById.get(categoriaRaw) || categoriaRaw;
  };


  const filtered = categoria === "tutti"
    ? gelati
    : gelati.filter((g) => String(g.categoria ?? g.categoria_id ?? "") === String(categoria));

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
          <Tabs value={categoria} onValueChange={setCategoria} className="w-full">
            <TabsList className="w-full bg-secondary group-data-horizontal/tabs:h-auto grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center gap-1 p-1 relative z-10">
              {categorieTabs.map((c) => (
                <TabsTrigger
                  key={c.value}
                  value={c.value}
                  className="rounded-full px-4 text-sm font-body w-full"
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
                <GelatoCard key={gelato.id} gelato={gelato} categoria={getCategoriaLabel(gelato)} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}