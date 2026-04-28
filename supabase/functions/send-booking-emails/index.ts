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

const formatBookingDetailsText = (booking: BookingPayload) => `
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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const bookingRows = (booking: BookingPayload) => [
  ["Nome", booking.nome_cliente],
  ["Telefono", booking.telefono],
  ["Email", booking.email || "-"],
  ["Data ritiro", booking.data_ritiro],
  ["Ora ritiro", booking.ora_ritiro],
  ["Gusti", booking.gusti],
  ["Taglia", booking.taglia || "-"],
  ["Quantita", String(booking.quantita ?? 1)],
  ["Note", booking.note || "-"],
];

const buildEmailHtml = (title: string, subtitle: string, booking: BookingPayload) => {
  const rows = bookingRows(booking)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;width:34%;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(value)}</td>
      </tr>
    `,
    )
    .join("");

  return `
  <div style="margin:0;background:#fdf9fb;padding:24px;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f1e5ea;border-radius:18px;overflow:hidden;">
      <div style="padding:18px 22px;background:linear-gradient(90deg,#fdf4f8 0%,#fff 100%);border-bottom:1px solid #f1e5ea;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b04979;font-weight:700;">Bar Gelateria L'Oasi</div>
        <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.2;color:#241a1f;">${escapeHtml(title)}</h1>
        <p style="margin:8px 0 0 0;color:#6b5b65;font-size:14px;">${escapeHtml(subtitle)}</p>
      </div>
      <div style="padding:18px 22px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f1e5ea;border-radius:12px;overflow:hidden;">
          ${rows}
        </table>
      </div>
      <div style="padding:14px 22px;background:#fff7fa;border-top:1px solid #f1e5ea;color:#8c6f7f;font-size:12px;">
        Questo messaggio e stato inviato automaticamente dal sistema prenotazioni di Gelateria Oasi.
      </div>
    </div>
  </div>
  `;
};

const sendBrevoEmail = async (to: string, subject: string, text: string, html: string) => {
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
      htmlContent: html,
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

    const details = formatBookingDetailsText(booking);

    await sendBrevoEmail(
      gelateriaEmail,
      `Nuova prenotazione - ${booking.nome_cliente}`,
      `Hai ricevuto una nuova prenotazione.\n\n${details}`,
      buildEmailHtml(
        "Nuova prenotazione ricevuta",
        "Dettagli ordine cliente",
        booking as BookingPayload,
      ),
    );

    if (booking.email) {
      await sendBrevoEmail(
        booking.email,
        "Conferma ricezione prenotazione - Gelateria Oasi",
        `Ciao ${booking.nome_cliente},\nabbiamo ricevuto la tua prenotazione.\n\n${details}\nTi ricontatteremo al piu presto.`,
        buildEmailHtml(
          "Prenotazione ricevuta",
          `Ciao ${booking.nome_cliente}, abbiamo preso in carico il tuo ordine.`,
          booking as BookingPayload,
        ),
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
