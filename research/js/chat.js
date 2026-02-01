import { byId, val } from "./dom.js";
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { escapeHTML, makeId } from "./utils.js";

function getThread(bookingId) {
  let thread = state.chats.find(t => t.bookingId === bookingId);
  if (!thread) {
    thread = { bookingId, messages: [] };
    state.chats.push(thread);
    saveArray(K.chats, state.chats);
  }
  return thread;
}

function addMessage(bookingId, senderRole, senderId, text) {
  const thread = getThread(bookingId);
  thread.messages.push({ id: makeId(), senderRole, senderId, text, createdAt: Date.now() });
  saveArray(K.chats, state.chats);
}

function renderThread(bookingId, containerId, meRole, meId) {
  const el = byId(containerId);
  if (!el) return;
  el.innerHTML = "";

  if (!bookingId) {
    el.innerHTML = `<p class="muted">Select a booking to view chat.</p>`;
    return;
  }

  const thread = getThread(bookingId);
  if (thread.messages.length === 0) {
    el.innerHTML = `<p class="muted">No messages yet.</p>`;
    return;
  }

  thread.messages.forEach(m => {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + ((m.senderRole === meRole && m.senderId === meId) ? "chat-me" : "chat-them");
    bubble.innerHTML = `
      <div class="muted tiny">${escapeHTML(m.senderRole)}</div>
      <div>${escapeHTML(m.text)}</div>
    `;
    el.appendChild(bubble);
  });

  el.scrollTop = el.scrollHeight;
}

export function renderClientChatBookingList() {
  const sess = getSession();
  const list = byId("client-chat-booking-list");
  if (!list) return;
  list.innerHTML = "";
  if (!sess || sess.role !== "client") return;

  const my = state.bookings.filter(b => b.clientId === sess.id).sort((a,b) => b.createdAt - a.createdAt);
  if (my.length === 0) {
    list.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  my.forEach(b => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.innerHTML = `
      <div><b>${escapeHTML(b.service)}</b></div>
      <div class="muted tiny">${escapeHTML(b.providerName)} • ${escapeHTML(b.status)}</div>
      <button class="action-btn" style="margin-top:10px;" data-chat-open="client:${b.id}">Open</button>
    `;
    list.appendChild(div);
  });
}

export function clientOpenChat(bookingId) {
  state.activeChatBookingIdClient = bookingId;
  window.clientSetTab?.("chat");
  renderChatThreadClient();
}

export function renderChatThreadClient() {
  const sess = getSession();
  if (!sess || sess.role !== "client") return;
  renderThread(state.activeChatBookingIdClient, "chat-thread", "client", sess.id);
}

export function sendChatMessage() {
  const sess = getSession();
  if (!sess || sess.role !== "client") return alert("Client login required.");
  if (!state.activeChatBookingIdClient) return alert("Select a booking first.");

  const msg = val("chat-message");
  if (!msg) return;

  addMessage(state.activeChatBookingIdClient, "client", sess.id, msg);
  byId("chat-message").value = "";
  renderChatThreadClient();
}

export function renderProviderChatBookingList() {
  const sess = getSession();
  const list = byId("provider-chat-booking-list");
  if (!list) return;
  list.innerHTML = "";
  if (!sess || sess.role !== "provider") return;

  const my = state.bookings.filter(b => b.providerId === sess.id).sort((a,b) => b.createdAt - a.createdAt);
  if (my.length === 0) {
    list.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  my.forEach(b => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.innerHTML = `
      <div><b>${escapeHTML(b.service)}</b></div>
      <div class="muted tiny">${escapeHTML(b.clientName)} • ${escapeHTML(b.status)}</div>
      <button class="action-btn" style="margin-top:10px;" data-chat-open="provider:${b.id}">Open</button>
    `;
    list.appendChild(div);
  });
}

export function providerOpenChat(bookingId) {
  state.activeChatBookingIdProvider = bookingId;
  window.providerSetTab?.("chat");
  renderChatThreadProvider();
}

export function renderChatThreadProvider() {
  const sess = getSession();
  if (!sess || sess.role !== "provider") return;
  renderThread(state.activeChatBookingIdProvider, "chat-thread-provider", "provider", sess.id);
}

export function sendChatMessageProvider() {
  const sess = getSession();
  if (!sess || sess.role !== "provider") return alert("Provider login required.");
  if (!state.activeChatBookingIdProvider) return alert("Select a booking first.");

  const msg = val("chat-message-provider");
  if (!msg) return;

  addMessage(state.activeChatBookingIdProvider, "provider", sess.id, msg);
  byId("chat-message-provider").value = "";
  renderChatThreadProvider();
}
