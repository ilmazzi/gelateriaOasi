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

const escapeHtml = (value: unknown) =>
  String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const statoBadgeColor = (stato: string) => {
  if (stato === "confermata") return "#1d7f4b";
  if (stato === "pronta") return "#0b76d1";
  if (stato === "ritirata") return "#6b7280";
  if (stato === "annullata") return "#b42318";
  return "#b04979";
};

const buildStatusHtml = (booking: BookingPayload, statoLabel: string) => `
  <div style="margin:0;background:#fdf9fb;padding:24px;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f1e5ea;border-radius:18px;overflow:hidden;">
      <div style="padding:18px 22px;background:linear-gradient(90deg,#fdf4f8 0%,#fff 100%);border-bottom:1px solid #f1e5ea;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b04979;font-weight:700;">Bar Gelateria L'Oasi</div>
        <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.2;color:#241a1f;">Aggiornamento prenotazione</h1>
        <p style="margin:8px 0 0 0;color:#6b5b65;font-size:14px;">Ciao ${escapeHtml(booking.nome_cliente)}, lo stato del tuo ordine e cambiato.</p>
      </div>
      <div style="padding:18px 22px;">
        <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:${statoBadgeColor(booking.stato || "in_attesa")}15;color:${statoBadgeColor(booking.stato || "in_attesa")};font-size:12px;font-weight:700;margin-bottom:14px;">
          Stato: ${escapeHtml(statoLabel)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f1e5ea;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;width:34%;">Data ritiro</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.data_ritiro)}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Ora ritiro</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.ora_ritiro)}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Ordine</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.gusti)}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b5b65;font-size:13px;">Taglia / Quantita</td><td style="padding:10px 12px;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.taglia || "-")} / ${escapeHtml(String(booking.quantita ?? 1))}</td></tr>
        </table>
      </div>
      <div style="padding:14px 22px;background:#fff7fa;border-top:1px solid #f1e5ea;color:#8c6f7f;font-size:12px;">
        Per modifiche o richieste aggiuntive, contatta direttamente la gelateria.
      </div>
    </div>
  </div>
`;

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
    if (!booking || !booking.email) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stato = booking.stato || "in_attesa";
    const statoLabel = statoLabels[stato] || stato;
    const subject = `Aggiornamento prenotazione: ${statoLabel}`;
    const body = `Ciao ${booking.nome_cliente},\nla tua prenotazione e stata aggiornata.\n\nStato: ${statoLabel}\nData ritiro: ${booking.data_ritiro}\nOra ritiro: ${booking.ora_ritiro}\nOrdine: ${booking.gusti}\nTaglia: ${booking.taglia || "-"}\nQuantita: ${booking.quantita ?? 1}\n\nGrazie,\nGelateria Oasi`;

    await sendBrevoEmail(booking.email, subject, body, buildStatusHtml(booking, statoLabel));

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
