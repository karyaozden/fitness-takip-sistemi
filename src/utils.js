export const todayIso = () => new Date().toISOString().slice(0, 10);

export function formatDate(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatGoal(goal) {
  const goals = {
    "kilo-verme": "Kilo verme",
    "kas-kazanma": "Kas kazanma",
    "fit-kalma": "Fit kalma",
  };
  return goals[goal] || "-";
}

export function sumBy(entries, key) {
  return entries.reduce((total, item) => total + Number(item[key] || 0), 0);
}

export function newestByDate(entries) {
  return [...entries].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
}

export function validateRequiredText(value, label) {
  return value.trim() ? "" : `${label} boş bırakılamaz.`;
}

export function validatePositiveNumber(value, label) {
  const number = Number(value);
  if (value === "") return `${label} boş bırakılamaz.`;
  if (!Number.isFinite(number)) return `${label} geçerli bir sayı olmalı.`;
  if (number < 0) return `${label} negatif olamaz.`;
  return "";
}

export function validateDate(value, label = "Tarih") {
  if (!value) return `${label} boş bırakılamaz.`;
  if (Number.isNaN(new Date(`${value}T00:00:00`).getTime())) {
    return `${label} geçerli olmalı.`;
  }
  return "";
}
