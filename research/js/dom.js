export function byId(id) { return document.getElementById(id); }
export function val(id) { return (byId(id)?.value || "").trim(); }
