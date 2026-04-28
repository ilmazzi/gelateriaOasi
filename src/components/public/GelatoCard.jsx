import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { IceCreamCone } from "lucide-react";

const categoriaLabels = {
  classico: "Classico",
  frutta: "Frutta",
  speciale: "Speciale",
  vegano: "Vegano",
  senza_zucchero: "Senza Zucchero",
};

export default function GelatoCard({ gelato, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500"
    >
      <div className="aspect-square overflow-hidden bg-secondary relative">
        {gelato.foto ? (
          <img
            src={gelato.foto}
            alt={gelato.nome}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IceCreamCone className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {gelato.categoria && (
          <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border-0 text-xs">
            {categoriaLabels[gelato.categoria] || gelato.categoria}
          </Badge>
        )}
        {!gelato.disponibile && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">Non disponibile</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg font-semibold mb-1">{gelato.nome}</h3>
        {gelato.descrizione && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{gelato.descrizione}</p>
        )}
        <div className="flex items-center gap-2 text-sm">
          {gelato.prezzo_piccolo && (
            <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
              P €{gelato.prezzo_piccolo.toFixed(2)}
            </span>
          )}
          {gelato.prezzo_medio && (
            <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
              M €{gelato.prezzo_medio.toFixed(2)}
            </span>
          )}
          {gelato.prezzo_grande && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
              G €{gelato.prezzo_grande.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}