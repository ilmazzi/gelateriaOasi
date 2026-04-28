import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookingPayload = {
  nome_cliente: string;
  telefono: string;
  email?: string | null;
  data_ritiro: string;
  ora_ritiro: string;
  gusti: string;
  taglia?: string | null;
  quantita?: number | null;
  note?: string | null;
};

const formatBookingDetails = (booking: BookingPayload) => `
Nome: ${booking.nome_cliente}
Telefono: ${booking.telefono}
Email: ${booking.email || "-"}
Data ritiro: ${booking.data_ritiro}
Ora ritiro: ${booking.ora_ritiro}
Gusti: ${booking.gusti}
Taglia: ${booking.taglia || "-"}
Quantita: ${booking.quantita ?? 1}
Note: ${booking.note || "-"}
`;

const sendResendEmail = async (to: string, subject: string, text: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("BOOKING_FROM_EMAIL");

  if (!resendApiKey || !fromEmail) {
    throw new Error("Config email mancante: imposta RESEND_API_KEY e BOOKING_FROM_EMAIL");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      text,
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
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gelateriaEmail = Deno.env.get("GELATERIA_BOOKING_EMAIL");
    if (!gelateriaEmail) {
      throw new Error("Config mancante: GELATERIA_BOOKING_EMAIL");
    }

    const details = formatBookingDetails(booking);

    await sendResendEmail(
      gelateriaEmail,
      `Nuova prenotazione - ${booking.nome_cliente}`,
      `Hai ricevuto una nuova prenotazione.\n\n${details}`,
    );

    if (booking.email) {
      await sendResendEmail(
        booking.email,
        "Conferma ricezione prenotazione - Gelateria Oasi",
        `Ciao ${booking.nome_cliente},\nabbiamo ricevuto la tua prenotazione.\n\n${details}\nTi ricontatteremo al piu presto.`,
      );
    }

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
