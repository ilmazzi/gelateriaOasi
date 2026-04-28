import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookingPayload = {
  nome_cliente: string;
  email?: string | null;
  data_ritiro: string;
  ora_ritiro: string;
  gusti: string;
  taglia?: string | null;
  quantita?: number | null;
  stato?: string | null;
};

const statoLabels: Record<string, string> = {
  in_attesa: "In attesa",
  confermata: "Confermata",
  pronta: "Pronta",
  ritirata: "Ritirata",
  annullata: "Annullata",
};

const sendBrevoEmail = async (to: string, subject: string, text: string) => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const fromEmail = Deno.env.get("BOOKING_FROM_EMAIL");

  if (!brevoApiKey || !fromEmail) {
    throw new Error("Config email mancante: imposta BREVO_API_KEY e BOOKING_FROM_EMAIL");
  }

  const senderMatch = fromEmail.match(/^(.*)<(.+)>$/);
  const sender = senderMatch
    ? { name: senderMatch[1].trim().replace(/^"|"$/g, ""), email: senderMatch[2].trim() }
    : { name: "Gelateria Oasi", email: fromEmail.trim() };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Invio email fallito (${response.status}): ${body}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking } = await req.json();
    if (!booking || !booking.email) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stato = booking.stato || "in_attesa";
    const statoLabel = statoLabels[stato] || stato;
    const subject = `Aggiornamento prenotazione: ${statoLabel}`;
    const body = `Ciao ${booking.nome_cliente},\nla tua prenotazione e stata aggiornata.\n\nStato: ${statoLabel}\nData ritiro: ${booking.data_ritiro}\nOra ritiro: ${booking.ora_ritiro}\nGusti: ${booking.gusti}\nTaglia: ${booking.taglia || "-"}\nQuantita: ${booking.quantita ?? 1}\n\nGrazie,\nGelateria Oasi`;

    await sendBrevoEmail(booking.email, subject, body);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
