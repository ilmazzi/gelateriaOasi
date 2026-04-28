import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const recensioni = [
  {
    nome: "Giulia M.",
    avatar: "G",
    stelle: 5,
    testo: "Il miglior gelato artigianale di Roma! Il pistacchio di Bronte è assolutamente divino, si sente la qualità degli ingredienti ad ogni cucchiaio.",
    gusto: "Pistacchio di Bronte",
  },
  {
    nome: "Marco T.",
    avatar: "M",
    stelle: 5,
    testo: "Ho prenotato una vaschetta grande per il compleanno di mia figlia e sono rimasto senza parole. Tutto perfetto, dalla qualità alla puntualità.",
    gusto: "Tiramisù",
  },
  {
    nome: "Alessandra R.",
    avatar: "A",
    stelle: 5,
    testo: "Finalmente una gelateria che fa gelati vegani buoni come quelli classici! Il cocco è cremoso e genuino, ci torno ogni settimana.",
    gusto: "Cocco Vegano",
  },
  {
    nome: "Luca F.",
    avatar: "L",
    stelle: 5,
    testo: "Ambiente bellissimo, personale gentilissimo e gelato straordinario. Il cioccolato fondente è il migliore che abbia mai assaggiato.",
    gusto: "Cioccolato Fondente",
  },
  {
    nome: "Sofia B.",
    avatar: "S",
    stelle: 5,
    testo: "Ho scoperto questo posto per caso e ora è la mia gelateria preferita! Le fragole bio hanno un profumo e un sapore incredibili.",
    gusto: "Fragola Bio",
  },
  {
    nome: "Roberto C.",
    avatar: "R",
    stelle: 5,
    testo: "La crema della nonna mi ha riportato indietro nel tempo! È esattamente come la ricordavo da bambino. Complimenti per aver mantenuto la tradizione.",
    gusto: "Crema della Nonna",
  },
];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
      ))}
    </div>
  );
}

export default function Recensioni() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">Cosa Dicono i Nostri Clienti</h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Oltre 500 recensioni a 5 stelle. La soddisfazione dei nostri clienti è la nostra ricompensa.
          </p>
          {/* Overall rating */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-accent text-accent" />
              ))}
            </div>
            <span className="font-heading text-2xl font-bold">5.0</span>
            <span className="text-muted-foreground font-body text-sm">su Google</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {recensioni.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-heading font-bold flex items-center justify-center text-lg flex-shrink-0">
                  {r.avatar}
                </div>
                <div>
                  <p className="font-body font-semibold text-sm">{r.nome}</p>
                  <StarRating count={r.stelle} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">
                "{r.testo}"
              </p>
              <span className="text-xs text-primary font-body font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                {r.gusto}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}