import { MapPin, Phone, Clock, Camera, CircleUserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient.js";

export default function Footer() {
  const { data: negozio = [] } = useQuery({
    queryKey: ["negozio-public"],
    queryFn: () => apiClient.entities.Negozio.list(),
  });

  const info = negozio?.[0] || {};

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo-oasi.png"
                alt=""
                width={160}
                height={160}
                className="h-8 w-auto shrink-0"
                decoding="async"
              />
              <span className="font-heading text-lg font-bold">
                {info.nome || "Bar Gelateria L'Oasi"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              {info.descrizione ||
                "Gelato artigianale fatto con passione, ingredienti freschi e ricette della tradizione italiana."}
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">Contatti</h3>
            <div className="space-y-3 text-sm text-muted-foreground font-body">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{info.indirizzo || "Via A. Manzoni, 16, 23868"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>{info.telefono || "+39 0341 580332"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{info.orari || "Lun - Dom: 10:00 - 23:00"}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">Link Rapidi</h3>
            <div className="space-y-2 text-sm font-body">
              <Link to="/menu" className="block text-muted-foreground hover:text-primary transition-colors">
                Menu Gelati
              </Link>
              <Link to="/promozioni" className="block text-muted-foreground hover:text-primary transition-colors">
                Promozioni
              </Link>
              <Link to="/prenota" className="block text-muted-foreground hover:text-primary transition-colors">
                Prenota Online
              </Link>
            </div>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all">
                <Camera className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all">
                <CircleUserRound className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}Gelateria Oasi. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}