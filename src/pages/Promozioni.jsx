import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import PromoCard from "@/components/public/PromoCard";

export default function Promozioni() {
  const { data: promozioni = [], isLoading } = useQuery({
    queryKey: ["promozioni-attive"],
    queryFn: () => base44.entities.Promozione.filter({ attiva: true }),
  });

  return (
    <div className="min-h-screen">
      <section className="pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-3">Promozioni</h1>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Scopri le nostre offerte speciali e risparmia sui tuoi gusti preferiti.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
            </div>
          ) : promozioni.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body text-lg">Nessuna promozione attiva al momento.</p>
              <p className="text-muted-foreground font-body text-sm mt-2">Torna presto per le nostre offerte!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promozioni.map((promo, i) => (
                <PromoCard key={promo.id} promo={promo} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}