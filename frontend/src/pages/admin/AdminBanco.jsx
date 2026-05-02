import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/api/apiClient.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarDays,
  Check,
  Clock,
  Bell,
  IceCreamBowl,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Timer,
  Volume2,
} from "lucide-react";

const states = {
  in_attesa: {
    label: "Da preparare",
    tone: "border-accent/30 bg-accent/20 text-accent-foreground",
    rail: "bg-accent",
  },
  confermata: {
    label: "In preparazione",
    tone: "border-primary/25 bg-primary/10 text-primary",
    rail: "bg-primary",
  },
  pronta: {
    label: "Pronta",
    tone: "border-chart-3/30 bg-chart-3/15 text-chart-3",
    rail: "bg-chart-3",
  },
  ritirata: {
    label: "Ritirata",
    tone: "border-border bg-muted text-muted-foreground",
    rail: "bg-muted-foreground",
  },
  annullata: {
    label: "Annullata",
    tone: "border-destructive/30 bg-destructive/10 text-destructive",
    rail: "bg-destructive",
  },
};

const filters = [
  { value: "today", label: "Oggi" },
  { value: "next", label: "Prossima ora" },
  { value: "tomorrow", label: "Domani" },
  { value: "open", label: "Aperte" },
  { value: "all", label: "Tutte" },
];

const pad = (value) => String(value).padStart(2, "0");

const localDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const normalizeDate = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return localDateKey(parsed);
};

const normalizeTime = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${pad(match[1])}:${match[2]}` : raw;
};

const toDateTime = (booking) => {
  const date = normalizeDate(booking.data_ritiro);
  const time = normalizeTime(booking.ora_ritiro) || "23:59";
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const extractMetaLine = (note, label) => {
  if (!note) return "";
  const match = String(note).match(new RegExp(`${label}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() || "";
};

const cleanNote = (note) => {
  if (!note) return "";
  return String(note)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !/^Tipo ordine:\s*/i.test(trimmed) && !/^Totale stimato:\s*/i.test(trimmed);
    })
    .join("\n")
    .trim();
};

const parseOrderDetails = (gusti) => {
  const raw = String(gusti || "").trim();
  if (!raw) return { gelati: "", panini: "", plain: "" };

  const parts = raw.split("|").map((part) => part.trim()).filter(Boolean);
  const gelatiPart = parts.find((part) => /^gelati:/i.test(part));
  const paniniPart = parts.find((part) => /^panini:/i.test(part));

  if (!gelatiPart && !paniniPart) return { gelati: "", panini: "", plain: raw };

  return {
    gelati: gelatiPart ? gelatiPart.replace(/^gelati:\s*/i, "").trim() : "",
    panini: paniniPart ? paniniPart.replace(/^panini:\s*/i, "").trim() : "",
    plain: "",
  };
};

const isLate = (booking) => {
  const pickup = toDateTime(booking);
  if (!pickup || ["ritirata", "annullata"].includes(booking.stato)) return false;
  return pickup.getTime() < Date.now() - 10 * 60 * 1000;
};

const matchesFilter = (booking, filter) => {
  const today = localDateKey(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDateKey(tomorrowDate);
  const bookingDate = normalizeDate(booking.data_ritiro);

  if (filter === "today") return bookingDate === today;
  if (filter === "tomorrow") return bookingDate === tomorrow;
  if (filter === "open") return !["ritirata", "annullata"].includes(booking.stato);
  if (filter === "next") {
    const pickup = toDateTime(booking);
    if (!pickup || ["ritirata", "annullata"].includes(booking.stato)) return false;
    const delta = pickup.getTime() - Date.now();
    return bookingDate === today && delta >= -10 * 60 * 1000 && delta <= 60 * 60 * 1000;
  }
  return true;
};

const searchBooking = (booking, search) => {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [
    booking.nome_cliente,
    booking.telefono,
    booking.email,
    booking.gusti,
    booking.note,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
};

const sortBookings = (a, b) => {
  const aTime = toDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bTime = toDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (aTime !== bTime) return aTime - bTime;
  return String(a.nome_cliente || "").localeCompare(String(b.nome_cliente || ""));
};

const notifyNewBooking = (booking) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const title = "Nuova prenotazione";
  const body = `${booking.nome_cliente || "Cliente"} - ${normalizeDate(booking.data_ritiro) || "data da confermare"} ${normalizeTime(booking.ora_ritiro) || ""}`.trim();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) =>
        registration.showNotification(title, {
          body,
          icon: "/logo-oasi-icon.png?iconVer=3",
          badge: "/favicon-32.png?iconVer=3",
          tag: `prenotazione-${booking.id}`,
        }),
      )
      .catch(() => new Notification(title, { body, icon: "/logo-oasi-icon.png?iconVer=3" }));
    return;
  }

  new Notification(title, { body, icon: "/logo-oasi-icon.png?iconVer=3" });
};

function StatBox({ label, value, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function OrderLine({ label, value }) {
  if (!value) return null;
  return (
    <p className="text-sm leading-6 text-foreground">
      <span className="font-semibold text-foreground">{label}:</span> {value}
    </p>
  );
}

function BookingCard({ booking, isUpdating, onStatus }) {
  const status = states[booking.stato || "in_attesa"] || states.in_attesa;
  const order = parseOrderDetails(booking.gusti);
  const note = cleanNote(booking.note);
  const total = extractMetaLine(booking.note, "Totale stimato");
  const orderType = extractMetaLine(booking.note, "Tipo ordine");
  const late = isLate(booking);
  const phoneHref = booking.telefono ? `tel:${String(booking.telefono).replace(/\s+/g, "")}` : "";

  return (
    <article className={`group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg ${late ? "border-destructive/50" : "border-border/60"}`}>
      <div className={`absolute inset-y-0 left-0 w-2 ${late ? "bg-red-500" : status.rail}`} />
      <div className="grid gap-4 p-4 pl-6 sm:grid-cols-[1fr_auto] sm:p-5 sm:pl-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading truncate text-2xl font-bold text-foreground">{booking.nome_cliente || "Cliente"}</h2>
            <Badge className={`border text-xs ${late ? states.annullata.tone : status.tone}`}>
              {late ? "In ritardo" : status.label}
            </Badge>
            {orderType && <Badge className="border border-border/70 bg-background/80 text-xs text-muted-foreground">{orderType}</Badge>}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {normalizeDate(booking.data_ritiro) || "-"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {normalizeTime(booking.ora_ritiro) || "-"}
            </span>
            {booking.telefono && (
              <a className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline" href={phoneHref}>
                <Phone className="size-4" />
                {booking.telefono}
              </a>
            )}
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 sm:grid-cols-2">
            <div>
              <OrderLine label="Gelati" value={order.gelati || order.plain} />
              {(booking.taglia || booking.quantita > 1) && (
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {booking.taglia ? `Vaschetta ${booking.taglia}` : ""}
                  {booking.taglia && booking.quantita > 1 ? " - " : ""}
                  {booking.quantita > 1 ? `Quantita x${booking.quantita}` : ""}
                </p>
              )}
            </div>
            <OrderLine label="Panini" value={order.panini} />
          </div>

          {(total || note) && (
            <div className="mt-3 flex flex-wrap items-start gap-x-5 gap-y-2 text-sm">
              {total && <p className="font-bold text-primary">Totale stimato: {total}</p>}
              {note && <p className="max-w-3xl text-muted-foreground">Nota: {note}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:w-52 sm:grid-cols-1">
          <Button
            className="h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/85"
            disabled={isUpdating}
            onClick={() => onStatus(booking.id, "confermata")}
          >
            <Timer className="size-4" />
            Prepara
          </Button>
          <Button
            className="h-12 rounded-full bg-chart-3 text-white hover:bg-chart-3/85"
            disabled={isUpdating}
            onClick={() => onStatus(booking.id, "pronta")}
          >
            <Check className="size-4" />
            Pronta
          </Button>
          <Button
            className="h-12 rounded-full border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
            disabled={isUpdating}
            variant="outline"
            onClick={() => onStatus(booking.id, "ritirata")}
          >
            <ShoppingBag className="size-4" />
            Ritirata
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function AdminBanco() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState("today");
  const [search, setSearch] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const knownBookingIdsRef = useRef(null);

  const {
    data: bookings = [],
    isFetching,
    isLoading,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["admin-banco-prenotazioni"],
    queryFn: () => apiClient.entities.Prenotazione.list("-created_date", 500),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, stato }) => apiClient.entities.Prenotazione.update(id, { stato }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-banco-prenotazioni"] });
      queryClient.invalidateQueries({ queryKey: ["admin-prenotazioni"] });
      if (result?._statusEmailSent === false) {
        toast({
          title: "Stato aggiornato",
          description: result._statusEmailError || "Email al cliente non inviata",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Aggiornamento non riuscito",
        description: error.message || "Controlla la connessione del tablet",
        variant: "destructive",
      });
    },
  });

  const playBookingSound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = audioContextRef.current || new AudioContext();
    audioContextRef.current = context;
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    gain.connect(context.destination);

    [0, 0.18].forEach((offset) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now + offset);
      oscillator.frequency.exponentialRampToValueAtTime(660, now + offset + 0.12);
      oscillator.connect(gain);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.16);
    });
  };

  const enableAlerts = async () => {
    try {
      playBookingSound();
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      setAlertsEnabled(true);
      toast({
        title: "Avvisi attivi",
        description: "Il tablet suonera quando arriva una nuova prenotazione.",
      });
    } catch (error) {
      toast({
        title: "Avvisi non attivati",
        description: error.message || "Il browser ha bloccato audio o notifiche.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const currentIds = new Set(bookings.map((booking) => String(booking.id)));
    const knownIds = knownBookingIdsRef.current;

    if (!knownIds) {
      knownBookingIdsRef.current = currentIds;
      return;
    }

    const newBookings = bookings.filter((booking) => !knownIds.has(String(booking.id)));
    knownBookingIdsRef.current = currentIds;

    if (!alertsEnabled || newBookings.length === 0) return;

    playBookingSound();
    notifyNewBooking(newBookings[0]);
    toast({
      title: newBookings.length === 1 ? "Nuova prenotazione" : `${newBookings.length} nuove prenotazioni`,
      description: newBookings[0]?.nome_cliente || "Controlla il banco prenotazioni.",
    });
  }, [alertsEnabled, bookings, toast]);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, filter)).filter((booking) => searchBooking(booking, search)).sort(sortBookings),
    [bookings, filter, search],
  );

  const todayBookings = useMemo(
    () => bookings.filter((booking) => normalizeDate(booking.data_ritiro) === localDateKey(new Date())),
    [bookings],
  );

  const openToday = todayBookings.filter((booking) => !["ritirata", "annullata"].includes(booking.stato)).length;
  const readyToday = todayBookings.filter((booking) => booking.stato === "pronta").length;
  const lateToday = todayBookings.filter(isLate).length;
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "--:--";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="w-full px-3 py-4 sm:px-5 lg:px-8">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border/50 bg-background/90 px-3 py-3 backdrop-blur-lg sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <IceCreamBowl className="size-6" />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading truncate text-3xl font-bold tracking-normal">Banco prenotazioni</h1>
                <p className="font-body text-sm font-medium text-muted-foreground">Aggiornato alle {lastUpdate}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] xl:min-w-[760px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-full border-border/70 bg-card pl-11 text-base shadow-sm"
                  placeholder="Cerca nome, telefono, gusto"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Button
                className={`h-12 rounded-full border-border/70 shadow-sm ${
                  alertsEnabled
                    ? "bg-primary text-primary-foreground hover:bg-primary/85"
                    : "bg-card text-foreground hover:bg-secondary"
                }`}
                variant={alertsEnabled ? "default" : "outline"}
                onClick={enableAlerts}
              >
                {alertsEnabled ? <Volume2 className="size-4" /> : <Bell className="size-4" />}
                {alertsEnabled ? "Avvisi attivi" : "Attiva avvisi"}
              </Button>
              <Button className="h-12 rounded-full border-border/70 bg-card text-foreground shadow-sm hover:bg-secondary" variant="outline" onClick={() => refetch()}>
                <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                Aggiorna
              </Button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                className={`h-10 shrink-0 border px-4 text-sm font-bold uppercase tracking-widest transition ${
                  filter === item.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                key={item.value}
                onClick={() => setFilter(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <section className="mt-4 grid gap-2 sm:grid-cols-3">
          <StatBox label="Aperte oggi" value={openToday} />
          <StatBox label="Pronte" value={readyToday} className="border-chart-3/30" />
          <StatBox label="In ritardo" value={lateToday} className="border-destructive/30" />
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="size-9 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="font-heading text-xl font-bold">Nessuna prenotazione in questa vista</p>
            <p className="mt-1 text-sm text-muted-foreground">Prova un altro filtro o svuota la ricerca.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {visibleBookings.map((booking) => (
              <BookingCard
                booking={booking}
                isUpdating={updateMut.isPending}
                key={booking.id}
                onStatus={(id, stato) => updateMut.mutate({ id, stato })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
