const PROFILE_KEY = "fittrack-profile";
const WORKOUTS_KEY = "fittrack-workouts";
const NUTRITION_KEY = "fittrack-nutrition";
const PROGRESS_KEY = "fittrack-progress";
const USERS_KEY = "fittrack-users";
const SESSION_KEY = "fittrack-session";

function scopedKey(key, userId) {
  return userId ? `${key}:${userId}` : key;
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readProfile(userId) {
  return readJson(scopedKey(PROFILE_KEY, userId), null);
}

export function writeProfile(profile, userId) {
  writeJson(scopedKey(PROFILE_KEY, userId), profile);
}

export function readWorkouts(userId) {
  return readJson(scopedKey(WORKOUTS_KEY, userId), []);
}

export function writeWorkouts(workouts, userId) {
  writeJson(scopedKey(WORKOUTS_KEY, userId), workouts);
}

export function readNutrition(userId) {
  return readJson(scopedKey(NUTRITION_KEY, userId), []);
}

export function writeNutrition(entries, userId) {
  writeJson(scopedKey(NUTRITION_KEY, userId), entries);
}

export function readProgress(userId) {
  return readJson(scopedKey(PROGRESS_KEY, userId), []);
}

export function writeProgress(entries, userId) {
  writeJson(scopedKey(PROGRESS_KEY, userId), entries);
}

export function readUsers() {
  return readJson(USERS_KEY, []);
}

export function writeUsers(users) {
  writeJson(USERS_KEY, users);
}

export function readAuthSession() {
  return readJson(SESSION_KEY, null);
}

export function writeAuthSession(session) {
  writeJson(SESSION_KEY, session);
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY);
}
