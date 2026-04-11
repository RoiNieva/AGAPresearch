
import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { makeId, fileToDataUrl } from "./utils.js";
import { showPage } from "./routing.js";
import { addNotification } from "./notifications.js";

// --- conflict helpers (from your step 3) ---
function parseTimeToMinutes(t) {
  if (!t) return null;
  const s = String(t).trim().toLowerCase();

  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return hh * 60 + mm;
  }

  const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2] || 0);
    const ap = m12[3];
    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    if (ap === "pm" && hh !== 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  return null;
}

function parseTimeRange(rangeText) {
  const s = String(rangeText || "").trim().toLowerCase();
  if (!s.includes("-")) return null;
  const parts = s.split("-").map(x => x.trim());
  if (parts.length !== 2) return null;
  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function providerBlockedOnDate(providerId, date) {
  return state.availability.some(a => a.providerId === providerId && a.date === date);
}

function findProviderConflicts(providerId, date, timeText) {
  const activeStatuses = new Set(["Accepted", "Ongoing", "Completed"]);
  const candidates = state.bookings.filter(b =>
    b.providerId === providerId &&
    b.date === date &&
    activeStatuses.has(b.status)
  );

  if (!candidates.length) return [];
  const reqRange = parseTimeRange(timeText);
  if (!reqRange) return candidates; // conservative

  return candidates.filter(b => {
    const br = parseTimeRange(b.time);
    if (!br) return true;
    return overlaps(reqRange, br);
  });
  
}


export function openBooking(providerId) {
  state.bookingDraft.providerId = providerId;

  const p = state.providers.find(x => x.id === providerId);
  if (!p) return alert("Provider not found.");

  byId("booking-provider-line").textContent = `Provider: ${p.profile?.name || ""}`;

  const sel = byId("booking-service");
  if (sel) {
    sel.innerHTML = "";
    (p.services || []).forEach(s => {
      const value = `${s.category}|||${s.service}`;
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = `${s.service} — ${s.category}`;
      sel.appendChild(opt);
    });
  }

  if (byId("booking-date")) byId("booking-date").value = p.profile?.date || "";
  if (byId("booking-time")) byId("booking-time").value = p.profile?.time || "";

  if (byId("booking-address")) byId("booking-address").value = "";
  if (byId("booking-notes")) byId("booking-notes").value = "";
  if (byId("booking-photo")) byId("booking-photo").value = "";
  if (byId("booking-lat")) byId("booking-lat").value = "";
  if (byId("booking-lng")) byId("booking-lng").value = "";

  showPage("booking-page");
}

export async function submitBooking() {
  const sess = getSession();
  if (!sess || sess.role !== "client") {
    window.__redirectAfterAuth = "booking-page";
    alert("Please sign in as a Client to submit your booking.");
    
    return showPage("client-auth");
  }

  const providerId = state.bookingDraft.providerId;
  const p = state.providers.find(x => x.id === providerId);
  if (!p) return alert("Provider not found.");

  const serviceRaw = byId("booking-service")?.value || "";
  const date = byId("booking-date")?.value || "";
  const time = val("booking-time");

  if (!serviceRaw || !date || !time) return alert("Fill service/date/time.");

  if (providerBlockedOnDate(providerId, date)) {
    return alert("This provider is unavailable on that date. Please choose another date.");
  }

  const conflicts = findProviderConflicts(providerId, date, time);
  if (conflicts.length) {
    return alert("This provider already has a booking that conflicts with that date/time. Please choose another time.");
  }

  let category = "";
  let service = serviceRaw;
  if (serviceRaw.includes("|||")) {
    const parts = serviceRaw.split("|||");
    category = parts[0] || "";
    service = parts[1] || "";
  }

  const lat = byId("booking-lat")?.value || "";
  const lng = byId("booking-lng")?.value || "";

  const photoFile = byId("booking-photo")?.files?.[0];
  const photo = await fileToDataUrl(photoFile);

  const clientName = (state.clients.find(c => c.id === sess.id)?.name || "Client");

  const booking = {
    id: makeId(),
    providerId,
    providerName: p.profile?.name || "",
    clientId: sess.id,
    clientName,
    service,
    category,
    date,
    time,
    address: val("booking-address"),
    notes: val("booking-notes"),
    photo: photo || "",
    location: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null,
    status: "Pending",
    createdAt: Date.now()
  };

  state.bookings.push(booking);
  saveArray(K.bookings, state.bookings);

  // ✅ Notify provider
  addNotification({
    toRole: "provider",
    toId: providerId,
    title: "New booking request",
    message: `${clientName} requested ${service} on ${date} (${time})`,
    linkPage: "provider-dashboard"
  });

  alert("Booking request sent!");
  showPage("client-dashboard");
}