import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, Percent } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function PromoCard({ promo, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500"
    >
      {promo.foto && (
        <div className="aspect-video overflow-hidden">
          <img
            src={promo.foto}
            alt={promo.titolo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {promo.sconto_percentuale && (
            <Badge className="bg-primary text-primary-foreground border-0">
              <Percent className="w-3 h-3 mr-1" />
              -{promo.sconto_percentuale}%
            </Badge>
          )}
        </div>
        <h3 className="font-heading text-xl font-semibold mb-2">{promo.titolo}</h3>
        {promo.descrizione && (
          <p className="text-sm text-muted-foreground mb-3">{promo.descrizione}</p>
        )}
        {(promo.data_inizio || promo.data_fine) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {promo.data_inizio && format(new Date(promo.data_inizio), "d MMM", { locale: it })}
              {promo.data_inizio && promo.data_fine && " — "}
              {promo.data_fine && format(new Date(promo.data_fine), "d MMM yyyy", { locale: it })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}