
import { state } from "./state.js";
import { K, saveArray, getSession } from "./storage.js";
import { makeId } from "./utils.js";

function now() { return Date.now(); }


export function addNotification({ toRole, toId, title, message, linkPage = "" }) {
  if (!toRole || !toId || !title) return;

  state.notifications.push({
    id: makeId(),
    toRole,
    toId,
    title,
    message: message || "",
    linkPage: linkPage || "",
    createdAt: now(),
    readAt: null
  });

  saveArray(K.notifications, state.notifications);
}

export function listNotificationsForSession(sess, limit = 50) {
  if (!sess) return [];
  return state.notifications
    .filter(n => n.toRole === sess.role && n.toId === sess.id)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}

export function countUnreadForSession(sess) {
  if (!sess) return 0;
  return state.notifications.filter(n =>
    n.toRole === sess.role && n.toId === sess.id && !n.readAt
  ).length;
}

export function markAllReadForSession(sess) {
  if (!sess) return;
  let changed = false;

  state.notifications.forEach(n => {
    if (n.toRole === sess.role && n.toId === sess.id && !n.readAt) {
      n.readAt = now();
      changed = true;
    }
  });

  if (changed) saveArray(K.notifications, state.notifications);
}

export function getMySession() {
  const sess = getSession();
  return sess || null;
}
