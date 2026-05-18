const PROFILE_KEY = "fittrack-profile";
const WORKOUTS_KEY = "fittrack-workouts";
const NUTRITION_KEY = "fittrack-nutrition";
const PROGRESS_KEY = "fittrack-progress";
const USERS_KEY = "fittrack-users";
const SESSION_KEY = "fittrack-session";

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

export function readProfile() {
  return readJson(PROFILE_KEY, null);
}

export function writeProfile(profile) {
  writeJson(PROFILE_KEY, profile);
}

export function readWorkouts() {
  return readJson(WORKOUTS_KEY, []);
}

export function writeWorkouts(workouts) {
  writeJson(WORKOUTS_KEY, workouts);
}

export function readNutrition() {
  return readJson(NUTRITION_KEY, []);
}

export function writeNutrition(entries) {
  writeJson(NUTRITION_KEY, entries);
}

export function readProgress() {
  return readJson(PROGRESS_KEY, []);
}

export function writeProgress(entries) {
  writeJson(PROGRESS_KEY, entries);
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
