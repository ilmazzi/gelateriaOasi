import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, IceCreamCone, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import GelatoCard from "@/components/public/GelatoCard";
import PromoCard from "@/components/public/PromoCard";
import Recensioni from "@/components/public/Recensioni";
import PaninoCard from "@/components/public/PaninoCard";


export default function Home() {
  const { data: negozio = [] } = useQuery({
    queryKey: ["negozio-public"],
    queryFn: () => base44.entities.Negozio.list(),
  });

  const infoNegozio = negozio?.[0] || {};
  const heroImage = infoNegozio.foto || "/hero-oasi.png";

  const {
    data: gelati = [],
    isLoading: isLoadingGelati,
    error: errorGelati,
  } = useQuery({
    queryKey: ["gelati-evidenza"],
    queryFn: () => base44.entities.Gelato.filter({ in_evidenza: true, disponibile: true }),
  });

  const {
    data: panini = [],
    isLoading: isLoadingPanini,
    error: errorPanini,
  } = useQuery({
    queryKey: ["panini-evidenza"],
    queryFn: () => base44.entities.Panino.filter({ in_evidenza: true, disponibile: true }),
  });

  const {
    data: promozioni = [],
    isLoading: isLoadingPromo,
    error: errorPromo,
  } = useQuery({
    queryKey: ["promo-attive"],
    queryFn: () => base44.entities.Promozione.filter({ attiva: true }),
  });

  const {
    data: foto = [],
    isLoading: isLoadingFoto,
    error: errorFoto,
  } = useQuery({
    queryKey: ["foto-evidenza"],
    queryFn: () => base44.entities.FotoGalleria.filter({ in_evidenza: true }),
  });

  const hasDataError = Boolean(errorGelati || errorPromo || errorFoto);
  const isLoadingData = isLoadingGelati || isLoadingPromo || isLoadingFoto;
  const errorDetails = [errorGelati, errorPromo, errorFoto]
    .filter(Boolean)
    .map((err) => err.message)
    .join(" | ");

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] md:h-auto md:min-h-[680px] flex items-center overflow-hidden">
        <div className="absolute inset-0 md:hidden">
          <img
            src={heroImage}
            alt="Bar Gelateria L'Oasi"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/85 to-background/30 sm:to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-body font-medium text-muted-foreground">Gelato Artigianale dal 1985</span>
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Il gusto della
                <span className="text-primary"> tradizione</span>
              </h1>
              <p className="text-lg  font-body leading-relaxed mb-8 max-w-md">
                Ogni gusto è un viaggio tra sapori autentici, ingredienti freschi e la passione per il gelato artigianale italiano.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/menu">
                  <Button size="lg" className="rounded-full px-8 font-body">
                    Scopri i Gusti
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/prenota">
                  <Button size="lg" variant="outline" className="rounded-full px-8 font-body">
                    Prenota Online
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="hidden md:flex justify-end">
              <div className="w-full max-w-md lg:max-w-lg h-[560px] rounded-3xl overflow-hidden border border-border/40 shadow-2xl">
                <img
                  src={heroImage}
                  alt="Bar Gelateria L'Oasi"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <IceCreamCone className="w-5 h-5 text-primary" />
              <span className="text-sm font-body font-medium">30+ Gusti Artigianali</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-body font-medium">
                {infoNegozio.orari || "Aperto 10:00 - 23:00"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-body font-medium">
                {infoNegozio.indirizzo || "Via Manzoni 16, Valmadrera"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Gelati in Evidenza */}
      {gelati.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">I Nostri Gusti in Evidenza</h2>
              <p className="text-muted-foreground font-body max-w-md mx-auto">
                Scopri le nostre creazioni più amate, preparate ogni giorno con ingredienti freschi.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {gelati.slice(0, 8).map((gelato, i) => (
                <GelatoCard key={gelato.id} gelato={gelato} index={i} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/menu">
                <Button variant="outline" size="lg" className="rounded-full px-8 font-body">
                  Vedi Tutti i Gusti
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

        {/* Gelati in Evidenza */}
        {panini.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">I Nostri Panini in Evidenza</h2>
              <p className="text-muted-foreground font-body max-w-md mx-auto">
                Scopri i nostri panini più amati, preparati ogni giorno con ingredienti freschi.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {panini.slice(0, 8).map((panino, i) => (
                <PaninoCard key={panino.id} panino={panino} index={i} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/panini">
                <Button variant="outline" size="lg" className="rounded-full px-8 font-body">
                  Vedi Tutti i Panini
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {!isLoadingData && !hasDataError && gelati.length === 0 && promozioni.length === 0 && foto.length === 0 && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-muted-foreground">
              Nessun dato trovato. Verifica di aver eseguito `supabase/migrations/20260428140500_init.sql` e `supabase/seed.sql` nel tuo progetto Supabase.
            </p>
          </div>
        </section>
      )}

      {hasDataError && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-destructive">
              Errore nel caricamento dati da Supabase. Controlla `.env.local` e le policy RLS.
            </p>
            {errorDetails && (
              <p className="text-xs text-muted-foreground mt-3 break-words">{errorDetails}</p>
            )}
          </div>
        </section>
      )}

      {/* Promozioni */}
      {promozioni.length > 0 && (
        <section className="py-20 bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">Promozioni Attive</h2>
              <p className="text-muted-foreground font-body">Non perdere le nostre offerte speciali!</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promozioni.slice(0, 3).map((promo, i) => (
                <PromoCard key={promo.id} promo={promo} index={i} />
              ))}
            </div>
            {promozioni.length > 3 && (
              <div className="text-center mt-10">
                <Link to="/promozioni">
                  <Button variant="outline" size="lg" className="rounded-full px-8 font-body">
                    Tutte le Promozioni
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gallery */}
      {foto.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">La Nostra Galleria</h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {foto.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img src={f.foto_url} alt={f.titolo || ""} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Recensioni />

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Prenota il tuo Gelato</h2>
            <p className="font-body text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Ordina in anticipo e passa a ritirare senza attesa!
            </p>
            <Link to="/prenota">
              <Button size="lg" variant="secondary" className="rounded-full px-8 font-body">
                Prenota Ora
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}