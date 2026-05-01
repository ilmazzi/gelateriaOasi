import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {  Sandwich } from "lucide-react";



export default function PaninoCard({ panino, categoria, index = 0 }) {
  const categoriaLabel = String(categoria || "").trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500"
    >
      <div className="aspect-square overflow-hidden bg-secondary relative">
        {panino.foto ? (
          <img
            src={panino.foto}
            alt={panino.nome}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sandwich className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {categoriaLabel && (
          <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border-0 text-xs">
            {categoriaLabel}
          </Badge>
        )}
        {!panino.disponibile && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">Non disponibile</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg font-semibold mb-1">{panino.nome}</h3>
        {panino.descrizione && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{panino.descrizione}</p>
        )}
        <div className="space-y-2">
          {typeof panino.prezzo === "number" && (
            <div className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
              €{panino.prezzo.toFixed(2)}
            </div>
          )}
          {panino.ingredienti && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              Ingredienti: {panino.ingredienti}
            </p>
          )}
          {panino.allergeni && (
            <p className="text-xs text-muted-foreground/90 line-clamp-1">
              Allergeni: {panino.allergeni}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}