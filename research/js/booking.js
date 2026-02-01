// js/booking.js
import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { makeId, fileToDataUrl, escapeHTML } from "./utils.js";
import { showPage } from "./routing.js";

export function openBooking(providerId) {
  state.bookingDraft.providerId = providerId;

  const sess = getSession();
  if (!sess || sess.role !== "client") {
    // use router so history/auth logic stays consistent
    window.__redirectAfterAuth = "booking-page";
    return showPage("client-auth");
  }

  const p = state.providers.find(x => x.id === providerId);
  if (!p) return alert("Provider not found.");

  byId("booking-provider-line").textContent = `Provider: ${p.profile?.name || ""}`;

  const sel = byId("booking-service");
  if (sel) {
    sel.innerHTML = "";

    (p.services || []).forEach(s => {
      // store category + service in value to avoid collisions
      const value = `${s.category}|||${s.service}`;
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = `${s.service} — ${s.category}`;
      sel.appendChild(opt);
    });
  }

  // Defaults from provider profile
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
  if (!sess || sess.role !== "client") return alert("Client login required.");

  const providerId = state.bookingDraft.providerId;
  const p = state.providers.find(x => x.id === providerId);
  if (!p) return alert("Provider not found.");

  const serviceRaw = byId("booking-service")?.value || "";
  const date = byId("booking-date")?.value || "";
  const time = val("booking-time");

  if (!serviceRaw || !date || !time) return alert("Fill service/date/time.");

  // decode service
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

  state.bookings.push({
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
  });

  saveArray(K.bookings, state.bookings);

  alert("Booking request sent!");
  showPage("client-dashboard");
}
