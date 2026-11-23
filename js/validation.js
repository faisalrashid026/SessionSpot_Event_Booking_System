// Shared frontend-demo validation. No credentials are stored by these helpers.
export const cleanText = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/gu, " ");
export function fullName(value) {
  const name = cleanText(value);
  if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(name))
    throw Error("Enter a full name using 2–80 letters, spaces, apostrophes or hyphens.");
  return name;
}
export function emailAddress(value) {
  const email = String(value ?? "").trim().toLowerCase();
  const parts = email.split("@");
  if (email.length > 254 || parts.length !== 2 || !parts[0] || parts[0].length > 64 ||
      /[\s<>\u0000-\u001f]/u.test(email) || parts[0].startsWith(".") || parts[0].endsWith(".") || email.includes("..") ||
      !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(parts[1]) ||
      parts[1].split(".").some((label) => label.length > 63 || label.startsWith("-") || label.endsWith("-")))
    throw Error("Enter a valid email address.");
  return email;
}
export function accountDetails(details) {
  return { name: fullName(details?.name), email: emailAddress(details?.email) };
}
// Retain the approved eight-character minimum/hint; adopt the original's
// 72-character ceiling and retain the existing requirement for a number.
export function checkPassword(value, confirmation) {
  if (typeof value !== "string" || value.length < 8 || value.length > 72 || !/[0-9]/.test(value) || /[\u0000-\u001f]/u.test(value))
    throw Error("Use 8–72 characters, including a number.");
  if (confirmation !== undefined && confirmation !== value) throw Error("Passwords do not match.");
  return true;
}
export function matchesEvent(event, query) {
  const term = cleanText(query).toLocaleLowerCase("en-CA");
  return !term || cleanText([event.title, event.description, event.organizer, event.location, event.venue].filter(Boolean).join(" ")).toLocaleLowerCase("en-CA").includes(term);
}
