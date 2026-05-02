/**
 * Template prenotazioni + invio tramite Brevo (ex Sendinblue).
 * Variabili env (Railway / .env): BREVO_API_KEY, BOOKING_FROM_EMAIL, GELATERIA_BOOKING_EMAIL
 * Alias chiave API: SENDINBLUE_API_KEY (nome storico).
 */

const stripEnv = (raw) => {
  let s = String(raw ?? "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const brevoApiKey = () =>
  stripEnv(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || process.env.BREVO_KEY || "");

const bookingFromEmail = () => stripEnv(process.env.BOOKING_FROM_EMAIL || "");

const gelateriaBookingEmail = () => stripEnv(process.env.GELATERIA_BOOKING_EMAIL || "");

const escapeHtml = (value) =>
  String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const extractMetaFromNote = (note) => {
  const raw = String(note || "");
  const tipoOrdine = raw.match(/Tipo ordine:\s*(.+)/i)?.[1]?.trim() || "";
  const totaleStimato = raw.match(/Totale stimato:\s*(.+)/i)?.[1]?.trim() || "";
  const userNote = raw
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !/^Tipo ordine:\s*/i.test(trimmed) && !/^Totale stimato:\s*/i.test(trimmed);
    })
    .join("\n")
    .trim();
  return { tipoOrdine, totaleStimato, userNote };
};

const parseOrderDetails = (gusti) => {
  const raw = String(gusti || "").trim();
  if (!raw) return { gelati: "", panini: "", plain: "" };
  const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
  const gelatiPart = parts.find((p) => /^gelati:/i.test(p));
  const paniniPart = parts.find((p) => /^panini:/i.test(p));
  if (!gelatiPart && !paniniPart) return { gelati: "", panini: "", plain: raw };
  return {
    gelati: gelatiPart ? gelatiPart.replace(/^gelati:\s*/i, "").trim() : "",
    panini: paniniPart ? paniniPart.replace(/^panini:\s*/i, "").trim() : "",
    plain: "",
  };
};

const formatBookingDetailsText = (booking) => {
  const meta = extractMetaFromNote(booking.note);
  const order = parseOrderDetails(booking.gusti);
  return `
Nome: ${booking.nome_cliente}
Telefono: ${booking.telefono}
Email: ${booking.email || "-"}
Data ritiro: ${booking.data_ritiro}
Ora ritiro: ${booking.ora_ritiro}
Ordine gelati: ${order.gelati || "-"}
Vaschetta / Quantita: ${booking.taglia || "-"} / ${booking.quantita ?? 1}
Ordine panini: ${order.panini || "-"}
Ordine (altro): ${order.plain || "-"}
Tipo ordine: ${meta.tipoOrdine || "-"}
Totale stimato: ${meta.totaleStimato || "-"}
Note: ${meta.userNote || "-"}
`;
};

const bookingRows = (booking) => {
  const meta = extractMetaFromNote(booking.note);
  const order = parseOrderDetails(booking.gusti);
  return [
    ["Nome", booking.nome_cliente],
    ["Telefono", booking.telefono],
    ["Email", booking.email || "-"],
    ["Data ritiro", booking.data_ritiro],
    ["Ora ritiro", booking.ora_ritiro],
    ["Ordine gelati", order.gelati || "-"],
    ["Vaschetta / Quantita", `${booking.taglia || "-"} / ${String(booking.quantita ?? 1)}`],
    ["Ordine panini", order.panini || "-"],
    ["Ordine (altro)", order.plain || "-"],
    ["Tipo ordine", meta.tipoOrdine || "-"],
    ["Totale stimato", meta.totaleStimato || "-"],
    ["Note", meta.userNote || "-"],
  ];
};

const buildEmailHtml = (title, subtitle, booking) => {
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

const statoLabels = {
  in_attesa: "In attesa",
  confermata: "Confermata",
  pronta: "Pronta",
  ritirata: "Ritirata",
  annullata: "Annullata",
};

const statoBadgeColor = (stato) => {
  if (stato === "confermata") return "#1d7f4b";
  if (stato === "pronta") return "#0b76d1";
  if (stato === "ritirata") return "#6b7280";
  if (stato === "annullata") return "#b42318";
  return "#b04979";
};

const buildStatusHtml = (booking, statoLabel) => {
  const meta = extractMetaFromNote(booking.note);
  const order = parseOrderDetails(booking.gusti);
  const stato = booking.stato || "in_attesa";
  const badgeBg = statoBadgeColor(stato);
  return `
  <div style="margin:0;background:#fdf9fb;padding:24px;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f1e5ea;border-radius:18px;overflow:hidden;">
      <div style="padding:18px 22px;background:linear-gradient(90deg,#fdf4f8 0%,#fff 100%);border-bottom:1px solid #f1e5ea;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b04979;font-weight:700;">Bar Gelateria L'Oasi</div>
        <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.2;color:#241a1f;">Aggiornamento prenotazione</h1>
        <p style="margin:8px 0 0 0;color:#6b5b65;font-size:14px;">Ciao ${escapeHtml(booking.nome_cliente)}, lo stato del tuo ordine e cambiato.</p>
      </div>
      <div style="padding:18px 22px;">
        <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:${badgeBg}15;color:${badgeBg};font-size:12px;font-weight:700;margin-bottom:14px;">
          Stato: ${escapeHtml(statoLabel)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f1e5ea;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;width:34%;">Data ritiro</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.data_ritiro)}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Ora ritiro</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.ora_ritiro)}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Ordine gelati</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(order.gelati || "-")}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Vaschetta / Quantita</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(booking.taglia || "-")} / ${escapeHtml(String(booking.quantita ?? 1))}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Ordine panini</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(order.panini || "-")}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Ordine (altro)</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(order.plain || "-")}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Tipo ordine</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(meta.tipoOrdine || "-")}</td></tr>
          <tr><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#6b5b65;font-size:13px;">Totale stimato</td><td style="padding:10px 12px;border-bottom:1px solid #f1e5ea;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(meta.totaleStimato || "-")}</td></tr>
          <tr><td style="padding:10px 12px;color:#6b5b65;font-size:13px;">Note</td><td style="padding:10px 12px;color:#241a1f;font-size:13px;font-weight:600;">${escapeHtml(meta.userNote || "-")}</td></tr>
        </table>
      </div>
      <div style="padding:14px 22px;background:#fff7fa;border-top:1px solid #f1e5ea;color:#8c6f7f;font-size:12px;">
        Per modifiche o richieste aggiuntive, contatta direttamente la gelateria.
      </div>
    </div>
  </div>
`;
};

async function sendBrevoEmail(to, subject, text, html) {
  const key = brevoApiKey();
  const fromRaw = bookingFromEmail();

  if (!key || !fromRaw) {
    throw new Error(
      "Config email mancante: imposta BREVO_API_KEY (o SENDINBLUE_API_KEY) e BOOKING_FROM_EMAIL sul backend Railway.",
    );
  }

  const senderMatch = fromRaw.match(/^(.*)<(.+)>$/);
  const sender = senderMatch
    ? { name: senderMatch[1].trim().replace(/^"|"$/g, ""), email: stripEnv(senderMatch[2]) }
    : { name: "Gelateria Oasi", email: fromRaw };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: stripEnv(to) }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    let hint = rawBody.slice(0, 400);
    try {
      const j = JSON.parse(rawBody);
      if (j.message) hint = j.message;
      if (Array.isArray(j.code)) hint = `${hint} (${j.code.join(", ")})`;
    } catch {
      /* ignore */
    }
    throw new Error(`Brevo HTTP ${response.status}: ${hint}`);
  }

  try {
    const j = JSON.parse(rawBody);
    if (j.messageId != null) {
      console.log(`[booking-email] Brevo ok messageId=${j.messageId} to=${stripEnv(to)}`);
    }
  } catch {
    console.log(`[booking-email] Brevo ok to=${stripEnv(to)}`);
  }
}

/** Solo mittente Brevo (es. cambio stato → mail al cliente). */
export function isBrevoOutboundConfigured() {
  return Boolean(brevoApiKey() && bookingFromEmail());
}

/** Nuova prenotazione: gelateria + cliente → serve anche inbox locale. */
export function isBookingEmailConfigured() {
  return isBrevoOutboundConfigured() && Boolean(gelateriaBookingEmail());
}

/** Diagnostica senza secret (health check). */
export function getBookingEmailDiagnostics() {
  return {
    brevoApiKeyPresent: Boolean(brevoApiKey()),
    bookingFromPresent: Boolean(bookingFromEmail()),
    gelateriaInboxPresent: Boolean(gelateriaBookingEmail()),
    outboundReady: isBrevoOutboundConfigured(),
    newBookingReady: isBookingEmailConfigured(),
  };
}

/** Notifica gelateria + conferma cliente (se ha email). */
export async function sendNewBookingEmails(booking) {
  const gelateriaEmail = gelateriaBookingEmail();
  if (!gelateriaEmail) {
    throw new Error("Config mancante: GELATERIA_BOOKING_EMAIL");
  }

  const details = formatBookingDetailsText(booking);

  await sendBrevoEmail(
    gelateriaEmail,
    `Nuova prenotazione - ${booking.nome_cliente}`,
    `Hai ricevuto una nuova prenotazione.\n\n${details}`,
    buildEmailHtml("Nuova prenotazione ricevuta", "Dettagli ordine cliente", booking),
  );

  if (booking.email && String(booking.email).trim()) {
    await sendBrevoEmail(
      String(booking.email).trim(),
      "Conferma ricezione prenotazione - Gelateria Oasi",
      `Ciao ${booking.nome_cliente},\nabbiamo ricevuto la tua prenotazione.\n\n${details}\nTi ricontatteremo al piu presto.`,
      buildEmailHtml(
        "Prenotazione ricevuta",
        `Ciao ${booking.nome_cliente}, abbiamo preso in carico il tuo ordine.`,
        booking,
      ),
    );
  }
}

/** Aggiornamento stato al cliente. */
export async function sendBookingStatusEmail(booking) {
  if (!booking.email || !String(booking.email).trim()) return;

  const stato = booking.stato || "in_attesa";
  const statoLabel = statoLabels[stato] || stato;
  const subject = `Aggiornamento prenotazione: ${statoLabel}`;
  const meta = extractMetaFromNote(booking.note);
  const order = parseOrderDetails(booking.gusti);
  const body = `Ciao ${booking.nome_cliente},\nla tua prenotazione e stata aggiornata.\n\nStato: ${statoLabel}\nData ritiro: ${booking.data_ritiro}\nOra ritiro: ${booking.ora_ritiro}\nOrdine gelati: ${order.gelati || "-"}\nVaschetta/Quantita: ${booking.taglia || "-"} / ${booking.quantita ?? 1}\nOrdine panini: ${order.panini || "-"}\nOrdine (altro): ${order.plain || "-"}\nTipo ordine: ${meta.tipoOrdine || "-"}\nTotale stimato: ${meta.totaleStimato || "-"}\nNote: ${meta.userNote || "-"}\n\nGrazie,\nGelateria Oasi`;

  await sendBrevoEmail(booking.email.trim(), subject, body, buildStatusHtml(booking, statoLabel));
}
