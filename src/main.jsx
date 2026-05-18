import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  clearAuthSession,
  readAuthSession,
  readNutrition,
  readProfile,
  readProgress,
  readUsers,
  readWorkouts,
  writeAuthSession,
  writeNutrition,
  writeProfile,
  writeProgress,
  writeUsers,
  writeWorkouts,
} from "./storage/fitnessStorage";
import {
  formatDate,
  formatGoal,
  newestByDate,
  sumBy,
  todayIso,
  validateDate,
  validatePositiveNumber,
  validateRequiredText,
} from "./utils";
import "./styles.css";

const navItems = [
  { to: "/", label: "Panel", end: true },
  { to: "/profil", label: "Profil" },
  { to: "/antrenman", label: "Antrenman" },
  { to: "/beslenme", label: "Beslenme" },
  { to: "/ilerleme", label: "İlerleme" },
];

const adminAccount = {
  email: "admin@fittrack.com",
  password: "admin123",
  name: "Admin",
};

const emptyWorkout = {
  exerciseName: "",
  sets: "",
  reps: "",
  duration: "",
  date: todayIso(),
};

const emptyMeal = {
  mealName: "kahvaltı",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  date: todayIso(),
};

const emptyProgress = {
  weekStart: todayIso(),
  weight: "",
  chest: "",
  waist: "",
  hip: "",
};

function useFitnessData(userId) {
  const [profile, setProfileState] = useState(() => readProfile(userId));
  const [workouts, setWorkoutsState] = useState(() => readWorkouts(userId));
  const [nutrition, setNutritionState] = useState(() => readNutrition(userId));
  const [progress, setProgressState] = useState(() => readProgress(userId));

  useEffect(() => {
    setProfileState(readProfile(userId));
    setWorkoutsState(readWorkouts(userId));
    setNutritionState(readNutrition(userId));
    setProgressState(readProgress(userId));
  }, [userId]);

  const setProfile = (value) => {
    setProfileState(value);
    writeProfile(value, userId);
  };

  const setWorkouts = (value) => {
    setWorkoutsState(value);
    writeWorkouts(value, userId);
  };

  const setNutrition = (value) => {
    setNutritionState(value);
    writeNutrition(value, userId);
  };

  const setProgress = (value) => {
    setProgressState(value);
    writeProgress(value, userId);
  };

  return {
    profile,
    setProfile,
    workouts,
    setWorkouts,
    nutrition,
    setNutrition,
    progress,
    setProgress,
  };
}

function App() {
  const [session, setSession] = useState(() => readAuthSession());
  const data = useFitnessData(session?.userId);
  const visibleNavItems = session?.role === "admin" ? [...navItems, { to: "/admin", label: "Admin" }] : navItems;

  const login = (nextSession) => {
    writeAuthSession(nextSession);
    setSession(nextSession);
  };

  const logout = () => {
    clearAuthSession();
    setSession(null);
  };

  if (!session) {
    return (
      <BrowserRouter>
        <AuthPage onAuth={login} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Ana menü">
          <NavLink className="brand" to="/" aria-label="FitTrack ana sayfa">
            <span className="brand-mark">F</span>
            <span>FitTrack</span>
          </NavLink>
          <nav className="nav-list" aria-label="Sayfalar">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="member-card">
            <img src="/assets/training.svg" alt="Antrenman yapan kişi" />
            <p className="eyebrow">Oturum</p>
            <strong>{data.profile?.fullName || session.name}</strong>
            <button className="secondary-button" type="button" onClick={logout}>
              Çıkış yap
            </button>
          </div>
        </aside>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard {...data} />} />
            <Route path="/profil" element={<ProfilePage {...data} />} />
            <Route path="/antrenman" element={<WorkoutPage {...data} />} />
            <Route path="/beslenme" element={<NutritionPage {...data} />} />
            <Route path="/ilerleme" element={<ProgressPage {...data} />} />
            <Route path="/admin" element={<AdminPage session={session} {...data} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordAgain: "",
    age: "",
    height: "",
    weight: "",
    goal: "kilo-verme",
  });
  const [errors, setErrors] = useState([]);

  const isRegister = mode === "register";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const users = readUsers();
    const nextErrors = [
      isRegister ? validateRequiredText(form.name, "Ad soyad") : "",
      isRegister ? validatePositiveNumber(form.age, "Yaş") : "",
      isRegister ? validatePositiveNumber(form.height, "Boy") : "",
      isRegister ? validatePositiveNumber(form.weight, "Kilo") : "",
      validateRequiredText(email, "E-posta"),
      validateRequiredText(form.password, "Şifre"),
    ].filter(Boolean);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.push("E-posta geçerli olmalı.");
    }

    if (form.password && form.password.length < 6) {
      nextErrors.push("Şifre en az 6 karakter olmalı.");
    }

    if (isRegister && form.password !== form.passwordAgain) {
      nextErrors.push("Şifre tekrarı eşleşmeli.");
    }

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    if (!isRegister && email === adminAccount.email && form.password === adminAccount.password) {
      onAuth({
        userId: "admin",
        name: adminAccount.name,
        email: adminAccount.email,
        role: "admin",
      });
      return;
    }

    if (isRegister) {
      if (users.some((user) => user.email === email)) {
        setErrors(["Bu e-posta ile kayıt var. Giriş yapabilirsiniz."]);
        return;
      }

      const user = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email,
        password: form.password,
      };
      writeUsers([...users, user]);
      writeProfile(
        {
          fullName: form.name.trim(),
          age: Number(form.age),
          height: Number(form.height),
          weight: Number(form.weight),
          goal: form.goal,
        },
        user.id,
      );
      onAuth({ userId: user.id, name: user.name, email: user.email, role: "user" });
      return;
    }

    const registeredUser = users.find((item) => item.email === email);
    if (!registeredUser) {
      setErrors(["Daha önce kayıt olmadınız. Lütfen kayıt olun."]);
      return;
    }

    if (registeredUser.password !== form.password) {
      setErrors(["E-posta veya şifre hatalı."]);
      return;
    }

    onAuth({ userId: registeredUser.id, name: registeredUser.name, email: registeredUser.email, role: "user" });
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <p className="eyebrow">FitTrack</p>
        <h1>Fitness takibine devam etmek için giriş yapın</h1>
        <p>Profil, antrenman, beslenme ve ilerleme kayıtlarınız tarayıcıda saklanır.</p>
      </section>

      <section className="auth-card panel">
        <div className="auth-tabs" aria-label="Oturum seçenekleri">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("login");
              setErrors([]);
            }}
          >
            Giriş yap
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("register");
              setErrors([]);
            }}
          >
            Kayıt ol
          </button>
        </div>

        {errors.length ? (
          <div className="error-box" role="alert">
            {errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : null}

        <form className="data-form auth-form" onSubmit={submit}>
          {isRegister ? (
            <Field label="Ad Soyad">
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </Field>
          ) : null}
          {isRegister ? (
            <>
              <Field label="Yaş">
                <input type="number" min="0" value={form.age} onChange={(event) => updateField("age", event.target.value)} />
              </Field>
              <Field label="Boy cm">
                <input type="number" min="0" value={form.height} onChange={(event) => updateField("height", event.target.value)} />
              </Field>
              <Field label="Kilo kg">
                <input type="number" min="0" value={form.weight} onChange={(event) => updateField("weight", event.target.value)} />
              </Field>
              <Field label="Hedef">
                <select value={form.goal} onChange={(event) => updateField("goal", event.target.value)}>
                  <option value="kilo-verme">Kilo verme</option>
                  <option value="kas-kazanma">Kas kazanma</option>
                  <option value="fit-kalma">Fit kalma</option>
                </select>
              </Field>
            </>
          ) : null}
          <Field label="E-posta">
            <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </Field>
          <Field label="Şifre">
            <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} />
          </Field>
          {isRegister ? (
            <Field label="Şifre tekrar">
              <input type="password" value={form.passwordAgain} onChange={(event) => updateField("passwordAgain", event.target.value)} />
            </Field>
          ) : null}
          <button className="primary-button" type="submit">
            {isRegister ? "Kayıt ol ve gir" : "Giriş yap"}
          </button>
        </form>
        <p className="auth-note">Admin paneli için giriş: admin@fittrack.com / admin123</p>
      </section>
    </main>
  );
}

function AdminPage({ session, profile, workouts, nutrition, progress }) {
  const [users, setUsers] = useState(() => readUsers());

  if (session.role !== "admin") {
    return (
      <>
        <PageHeader eyebrow="Admin" title="Yetkisiz erişim" />
        <article className="panel">
          <p className="empty-text">Bu sayfayı sadece admin hesabı görüntüleyebilir.</p>
        </article>
      </>
    );
  }

  function deleteUser(userId) {
    const nextUsers = users.filter((user) => user.id !== userId);
    setUsers(nextUsers);
    writeUsers(nextUsers);
  }

  return (
    <>
      <PageHeader eyebrow="Admin" title="Yönetim paneli" />
      <section className="metrics">
        <SummaryCard title="Kullanıcı" value={users.length} detail="Kayıtlı hesap" tone="green" />
        <SummaryCard title="Antrenman" value={workouts.length} detail="Toplam kayıt" tone="blue" />
        <SummaryCard title="Beslenme" value={nutrition.length} detail="Toplam öğün" tone="coral" />
        <SummaryCard title="İlerleme" value={progress.length} detail={profile ? `${profile.fullName} profili var` : "Profil yok"} tone="yellow" />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Kullanıcılar</p>
              <h2>Kayıtlı kullanıcılar</h2>
            </div>
          </div>
          <ul className="activity-list">
            {users.length ? (
              users.map((user) => (
                <li className="activity-item admin-user" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button className="danger-button" type="button" onClick={() => deleteUser(user.id)}>
                    Sil
                  </button>
                </li>
              ))
            ) : (
              <li className="empty-text">Henüz kullanıcı kaydı yok.</li>
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Sistem</p>
              <h2>Admin bilgileri</h2>
            </div>
          </div>
          <div className="detail-list">
            <span><strong>Admin e-posta</strong>{adminAccount.email}</span>
            <span><strong>Aktif oturum</strong>{session.name}</span>
            <span><strong>Yetki</strong>Admin</span>
          </div>
        </article>
      </section>
    </>
  );
}

function PageHeader({ eyebrow, title, meta }) {
  return (
    <section className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {meta ? <div className="date-pill">{meta}</div> : null}
    </section>
  );
}

function Dashboard({ profile, workouts, nutrition, progress }) {
  const todayMeals = nutrition.filter((item) => item.date === todayIso());
  const lastWorkout = newestByDate(workouts);
  const lastProgress = newestByDate(progress.map((item) => ({ ...item, date: item.weekStart })));
  const weeklyWorkouts = workouts.filter((item) => {
    const diff = new Date() - new Date(`${item.date}T00:00:00`);
    return diff >= 0 && diff <= 6 * 24 * 60 * 60 * 1000;
  });
  const goalAdvice = {
    "kilo-verme": "Kalori toplamlarını düzenli takip edin ve haftalık kilo değişimini not edin.",
    "kas-kazanma": "Protein hedefinizi yüksek tutup kuvvet antrenmanlarındaki set ve tekrarları izleyin.",
    "fit-kalma": "Haftalık hareket düzeninizi koruyup dengeli makro dağılımını takip edin.",
  };

  return (
    <>
      <PageHeader
        eyebrow="Fitness takip sistemi"
        title="Günlük performans paneli"
        meta={new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
      />

      <section className="metrics" aria-label="Günlük özetler">
        <SummaryCard title="Profil" value={profile?.fullName || "Profil yok"} detail={profile ? formatGoal(profile.goal) : "Profil sayfasından ekleyin"} tone="green" />
        <SummaryCard title="Son antrenman" value={lastWorkout?.exerciseName || "Kayıt yok"} detail={lastWorkout ? `${lastWorkout.sets} set · ${lastWorkout.reps} tekrar · ${lastWorkout.duration} dk` : "Henüz antrenman eklenmedi"} tone="blue" />
        <SummaryCard title="Bugünün kalorisi" value={`${sumBy(todayMeals, "calories")} kcal`} detail={`${sumBy(todayMeals, "protein")}g P · ${sumBy(todayMeals, "carbs")}g K · ${sumBy(todayMeals, "fat")}g Y`} tone="coral" />
        <SummaryCard title="Son kilo" value={lastProgress ? `${lastProgress.weight} kg` : "Kayıt yok"} detail={lastProgress ? formatDate(lastProgress.weekStart) : "Henüz ilerleme eklenmedi"} tone="yellow" />
      </section>

      <section className="dashboard-grid">
        <article className="panel advice-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Öneri</p>
              <h2>Hedefe göre odak</h2>
            </div>
          </div>
          <p>{profile ? goalAdvice[profile.goal] : "Profilinizi tamamlayınca hedefinize uygun kısa öneriler burada görünür."}</p>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Son 7 gün</p>
              <h2>Antrenman özeti</h2>
            </div>
          </div>
          <div className="macro-row">
            <span>Antrenman: <strong>{weeklyWorkouts.length}</strong></span>
            <span>Süre: <strong>{sumBy(weeklyWorkouts, "duration")} dk</strong></span>
            <span>Ortalama: <strong>{weeklyWorkouts.length ? Math.round(sumBy(weeklyWorkouts, "duration") / weeklyWorkouts.length) : 0} dk</strong></span>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Beslenme</p>
              <h2>Bugünün makro toplamları</h2>
            </div>
          </div>
          <div className="macro-row">
            <span>Protein: <strong>{sumBy(todayMeals, "protein")} g</strong></span>
            <span>Karbonhidrat: <strong>{sumBy(todayMeals, "carbs")} g</strong></span>
            <span>Yağ: <strong>{sumBy(todayMeals, "fat")} g</strong></span>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">İlerleme</p>
              <h2>Son kayıt özeti</h2>
            </div>
          </div>
          <p className="empty-text">
            {lastProgress
              ? `${formatDate(lastProgress.weekStart)} haftasında kilo ${lastProgress.weight} kg olarak kaydedildi.`
              : "Henüz ilerleme eklenmedi."}
          </p>
        </article>
      </section>
    </>
  );
}

function SummaryCard({ title, value, detail, tone }) {
  return (
    <article className="metric">
      <span className={`metric-icon ${tone}`} aria-hidden="true" />
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ProfilePage({ profile, setProfile }) {
  const [form, setForm] = useState(
    profile || { fullName: "", age: "", height: "", weight: "", goal: "kilo-verme" },
  );
  const [errors, setErrors] = useState([]);
  const [isEditing, setIsEditing] = useState(!profile);

  useEffect(() => {
    if (profile) {
      setForm(profile);
      setIsEditing(false);
    } else {
      setForm({ fullName: "", age: "", height: "", weight: "", goal: "kilo-verme" });
      setIsEditing(true);
    }
    setErrors([]);
  }, [profile]);

  function submit(event) {
    event.preventDefault();
    const nextErrors = [
      validateRequiredText(form.fullName, "Ad soyad"),
      validatePositiveNumber(form.age, "Yaş"),
      validatePositiveNumber(form.height, "Boy"),
      validatePositiveNumber(form.weight, "Kilo"),
    ].filter(Boolean);

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    setProfile({
      fullName: form.fullName.trim(),
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      goal: form.goal,
    });
    setErrors([]);
    setIsEditing(false);
  }

  return (
    <>
      <PageHeader eyebrow="Profil" title="Kişisel bilgiler" />
      <section className="two-column">
        <article className="panel profile-summary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Özet</p>
              <h2>Profil bilgileri</h2>
            </div>
            {profile ? (
              <button className="outline-button" type="button" onClick={() => setIsEditing(true)}>
                Profili güncelle
              </button>
            ) : null}
          </div>
          {profile ? (
            <div className="profile-overview">
              <div className="profile-identity">
                <span className="profile-avatar">{profile.fullName.charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{profile.fullName}</strong>
                  <p>{formatGoal(profile.goal)}</p>
                </div>
              </div>
              <div className="profile-stats">
                <span><strong>{profile.age}</strong>Yaş</span>
                <span><strong>{profile.height} cm</strong>Boy</span>
                <span><strong>{profile.weight} kg</strong>Kilo</span>
              </div>
              <div className="profile-note">
                <strong>Hedef</strong>
                <p>{formatGoal(profile.goal)} hedefine göre antrenman, beslenme ve ilerleme kayıtlarınızı takip edebilirsiniz.</p>
              </div>
            </div>
          ) : (
            <p className="empty-text">Henüz profil eklenmedi. İlk profil kaydını oluşturun.</p>
          )}
        </article>

        {isEditing ? (
          <FormPanel title={profile ? "Profili düzenle" : "Profil kaydet"} errors={errors} onSubmit={submit}>
            <Field label="Ad Soyad">
              <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </Field>
            <Field label="Yaş">
              <input type="number" min="0" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
            </Field>
            <Field label="Boy cm">
              <input type="number" min="0" value={form.height} onChange={(event) => setForm({ ...form, height: event.target.value })} />
            </Field>
            <Field label="Kilo kg">
              <input type="number" min="0" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} />
            </Field>
            <Field label="Hedef">
              <select value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })}>
                <option value="kilo-verme">Kilo verme</option>
                <option value="kas-kazanma">Kas kazanma</option>
                <option value="fit-kalma">Fit kalma</option>
              </select>
            </Field>
            <div className="form-actions">
              {profile ? (
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => {
                    setForm(profile);
                    setErrors([]);
                    setIsEditing(false);
                  }}
                >
                  İptal
                </button>
              ) : null}
              <button className="primary-button" type="submit">{profile ? "Değişiklikleri kaydet" : "Profili kaydet"}</button>
            </div>
          </FormPanel>
        ) : null}
      </section>
    </>
  );
}

function WorkoutPage({ workouts, setWorkouts }) {
  const [form, setForm] = useState(emptyWorkout);
  const [errors, setErrors] = useState([]);
  const [editingId, setEditingId] = useState(null);

  function submit(event) {
    event.preventDefault();
    const nextErrors = [
      validateRequiredText(form.exerciseName, "Egzersiz adı"),
      validatePositiveNumber(form.sets, "Set sayısı"),
      validatePositiveNumber(form.reps, "Tekrar sayısı"),
      validatePositiveNumber(form.duration, "Süre"),
      validateDate(form.date),
    ].filter(Boolean);

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    const workoutData = {
      id: editingId || crypto.randomUUID(),
      exerciseName: form.exerciseName.trim(),
      sets: Number(form.sets),
      reps: Number(form.reps),
      duration: Number(form.duration),
      date: form.date,
    };
    setWorkouts(editingId ? workouts.map((item) => (item.id === editingId ? workoutData : item)) : [...workouts, workoutData]);
    setForm(emptyWorkout);
    setEditingId(null);
    setErrors([]);
  }

  function deleteWorkout(workoutId) {
    setWorkouts(workouts.filter((workout) => workout.id !== workoutId));
    if (editingId === workoutId) {
      setForm(emptyWorkout);
      setEditingId(null);
    }
  }

  function editWorkout(workout) {
    setEditingId(workout.id);
    setForm({
      exerciseName: workout.exerciseName,
      sets: String(workout.sets),
      reps: String(workout.reps),
      duration: String(workout.duration),
      date: workout.date,
    });
    setErrors([]);
  }

  return (
    <>
      <PageHeader eyebrow="Antrenman" title="Egzersiz kayıtları" />
      <section className="two-column">
        <FormPanel title={editingId ? "Antrenmanı düzenle" : "Antrenman ekle"} errors={errors} onSubmit={submit}>
          <Field label="Egzersiz adı">
            <input value={form.exerciseName} onChange={(event) => setForm({ ...form, exerciseName: event.target.value })} />
          </Field>
          <Field label="Set sayısı">
            <input type="number" min="0" value={form.sets} onChange={(event) => setForm({ ...form, sets: event.target.value })} />
          </Field>
          <Field label="Tekrar sayısı">
            <input type="number" min="0" value={form.reps} onChange={(event) => setForm({ ...form, reps: event.target.value })} />
          </Field>
          <Field label="Süre dk">
            <input type="number" min="0" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
          </Field>
          <Field label="Tarih">
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <div className="form-actions">
            {editingId ? (
              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setForm(emptyWorkout);
                  setEditingId(null);
                  setErrors([]);
                }}
              >
                İptal
              </button>
            ) : null}
            <button className="primary-button" type="submit">{editingId ? "Değişiklikleri kaydet" : "Antrenmanı kaydet"}</button>
          </div>
        </FormPanel>
        <ListPanel title="Antrenman listesi" empty="Henüz antrenman eklenmedi.">
          {workouts.length
            ? [...workouts].reverse().map((workout) => (
                <li className="activity-item" key={workout.id}>
                  <div>
                    <strong>{workout.exerciseName}</strong>
                    <span>{formatDate(workout.date)} · {workout.sets} set · {workout.reps} tekrar</span>
                  </div>
                  <div className="list-actions">
                    <strong>{workout.duration} dk</strong>
                    <button className="outline-button compact" type="button" onClick={() => editWorkout(workout)}>
                      Düzenle
                    </button>
                    <button className="danger-button compact" type="button" onClick={() => deleteWorkout(workout.id)}>
                      Sil
                    </button>
                  </div>
                </li>
              ))
            : null}
        </ListPanel>
      </section>
    </>
  );
}

function NutritionPage({ nutrition, setNutrition }) {
  const [form, setForm] = useState(emptyMeal);
  const [errors, setErrors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [editingId, setEditingId] = useState(null);
  const [chartMetric, setChartMetric] = useState("calories");
  const selectedMeals = nutrition.filter((item) => item.date === selectedDate);
  const nutritionChartOptions = {
    calories: { label: "Kalori", unit: "kcal", color: "#df6f57" },
    protein: { label: "Protein", unit: "g", color: "#2f9e5d" },
    carbs: { label: "Karbonhidrat", unit: "g", color: "#2f6fb7" },
    fat: { label: "Yağ", unit: "g", color: "#d9a129" },
  };
  const nutritionChartData = useMemo(() => {
    const dailyTotals = nutrition.reduce((totals, meal) => {
      if (!totals[meal.date]) {
        totals[meal.date] = { date: meal.date, calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      totals[meal.date].calories += Number(meal.calories || 0);
      totals[meal.date].protein += Number(meal.protein || 0);
      totals[meal.date].carbs += Number(meal.carbs || 0);
      totals[meal.date].fat += Number(meal.fat || 0);
      return totals;
    }, {});

    return Object.values(dailyTotals)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((item) => ({ ...item, tarih: formatDate(item.date) }));
  }, [nutrition]);

  function submit(event) {
    event.preventDefault();
    const nextErrors = [
      validatePositiveNumber(form.calories, "Kalori"),
      validatePositiveNumber(form.protein, "Protein"),
      validatePositiveNumber(form.carbs, "Karbonhidrat"),
      validatePositiveNumber(form.fat, "Yağ"),
      validateDate(form.date),
    ].filter(Boolean);

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    const mealData = {
      id: editingId || crypto.randomUUID(),
      mealName: form.mealName,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      date: form.date,
    };
    setNutrition(editingId ? nutrition.map((item) => (item.id === editingId ? mealData : item)) : [...nutrition, mealData]);
    setForm(emptyMeal);
    setEditingId(null);
    setErrors([]);
  }

  function deleteMeal(mealId) {
    setNutrition(nutrition.filter((meal) => meal.id !== mealId));
    if (editingId === mealId) {
      setForm(emptyMeal);
      setEditingId(null);
    }
  }

  function editMeal(meal) {
    setEditingId(meal.id);
    setForm({
      mealName: meal.mealName,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fat: String(meal.fat),
      date: meal.date,
    });
    setErrors([]);
  }

  return (
    <>
      <PageHeader eyebrow="Beslenme" title="Öğün ve makro takibi" />
      <section className="panel date-filter">
        <div>
          <p className="eyebrow">Gün seçimi</p>
          <h2>Toplamları hangi gün için görmek istiyorsunuz?</h2>
        </div>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
      </section>
      <section className="metrics nutrition-totals">
        <SummaryCard title="Kalori" value={`${sumBy(selectedMeals, "calories")} kcal`} detail={formatDate(selectedDate)} tone="coral" />
        <SummaryCard title="Protein" value={`${sumBy(selectedMeals, "protein")} g`} detail="Seçili gün toplamı" tone="green" />
        <SummaryCard title="Karbonhidrat" value={`${sumBy(selectedMeals, "carbs")} g`} detail="Seçili gün toplamı" tone="blue" />
        <SummaryCard title="Yağ" value={`${sumBy(selectedMeals, "fat")} g`} detail="Seçili gün toplamı" tone="yellow" />
      </section>
      <article className="panel nutrition-chart-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Grafik</p>
            <h2>{nutritionChartOptions[chartMetric].label} takibi</h2>
          </div>
        </div>
        <div className="chart-panel">
          {nutritionChartData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={nutritionChartData} margin={{ top: 20, right: 18, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde5dc" />
                <XAxis dataKey="tarih" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={44} />
                <Tooltip formatter={(value) => [`${value} ${nutritionChartOptions[chartMetric].unit}`, nutritionChartOptions[chartMetric].label]} />
                <Line
                  type="monotone"
                  dataKey={chartMetric}
                  stroke={nutritionChartOptions[chartMetric].color}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-text">Grafik için henüz beslenme kaydı eklenmedi.</p>
          )}
        </div>
        <div className="chart-toggle" aria-label="Grafik metriği">
          {Object.entries(nutritionChartOptions).map(([key, option]) => (
            <button
              key={key}
              className={chartMetric === key ? "active" : ""}
              type="button"
              onClick={() => setChartMetric(key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </article>
      <section className="two-column">
        <FormPanel title={editingId ? "Beslenme kaydını düzenle" : "Beslenme kaydı ekle"} errors={errors} onSubmit={submit}>
          <Field label="Öğün adı">
            <select value={form.mealName} onChange={(event) => setForm({ ...form, mealName: event.target.value })}>
              <option value="kahvaltı">Kahvaltı</option>
              <option value="öğle">Öğle</option>
              <option value="akşam">Akşam</option>
            </select>
          </Field>
          <Field label="Kalori">
            <input type="number" min="0" value={form.calories} onChange={(event) => setForm({ ...form, calories: event.target.value })} />
          </Field>
          <Field label="Protein g">
            <input type="number" min="0" value={form.protein} onChange={(event) => setForm({ ...form, protein: event.target.value })} />
          </Field>
          <Field label="Karbonhidrat g">
            <input type="number" min="0" value={form.carbs} onChange={(event) => setForm({ ...form, carbs: event.target.value })} />
          </Field>
          <Field label="Yağ g">
            <input type="number" min="0" value={form.fat} onChange={(event) => setForm({ ...form, fat: event.target.value })} />
          </Field>
          <Field label="Tarih">
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <div className="form-actions">
            {editingId ? (
              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setForm(emptyMeal);
                  setEditingId(null);
                  setErrors([]);
                }}
              >
                İptal
              </button>
            ) : null}
            <button className="primary-button" type="submit">{editingId ? "Değişiklikleri kaydet" : "Öğünü kaydet"}</button>
          </div>
        </FormPanel>
        <ListPanel title="Beslenme listesi" empty="Henüz beslenme kaydı eklenmedi.">
          {nutrition.length
            ? [...nutrition].reverse().map((meal) => (
                <li className="activity-item" key={meal.id}>
                  <div>
                    <strong>{meal.mealName}</strong>
                    <span>{formatDate(meal.date)} · P {meal.protein}g · K {meal.carbs}g · Y {meal.fat}g</span>
                  </div>
                  <div className="list-actions">
                    <strong>{meal.calories} kcal</strong>
                    <button className="outline-button compact" type="button" onClick={() => editMeal(meal)}>
                      Düzenle
                    </button>
                    <button className="danger-button compact" type="button" onClick={() => deleteMeal(meal.id)}>
                      Sil
                    </button>
                  </div>
                </li>
              ))
            : null}
        </ListPanel>
      </section>
    </>
  );
}

function ProgressPage({ progress, setProgress }) {
  const [form, setForm] = useState(emptyProgress);
  const [errors, setErrors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const sortedProgress = [...progress].sort((a, b) => String(a.weekStart).localeCompare(String(b.weekStart)));
  const latestProgress = sortedProgress[sortedProgress.length - 1];
  const previousProgress = sortedProgress[sortedProgress.length - 2];
  const weightDiff = latestProgress && previousProgress ? Number((latestProgress.weight - previousProgress.weight).toFixed(1)) : null;
  const chartData = useMemo(
    () =>
      sortedProgress.map((item) => ({ tarih: formatDate(item.weekStart), kilo: item.weight })),
    [progress],
  );

  function submit(event) {
    event.preventDefault();
    const nextErrors = [
      validateDate(form.weekStart, "Hafta başlangıcı"),
      validatePositiveNumber(form.weight, "Kilo"),
      form.chest === "" ? "" : validatePositiveNumber(form.chest, "Göğüs ölçüsü"),
      form.waist === "" ? "" : validatePositiveNumber(form.waist, "Bel ölçüsü"),
      form.hip === "" ? "" : validatePositiveNumber(form.hip, "Kalça ölçüsü"),
    ].filter(Boolean);

    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    const progressData = {
      id: editingId || crypto.randomUUID(),
      weekStart: form.weekStart,
      weight: Number(form.weight),
      chest: form.chest === "" ? "" : Number(form.chest),
      waist: form.waist === "" ? "" : Number(form.waist),
      hip: form.hip === "" ? "" : Number(form.hip),
    };
    setProgress(editingId ? progress.map((item) => (item.id === editingId ? progressData : item)) : [...progress, progressData]);
    setForm(emptyProgress);
    setEditingId(null);
    setErrors([]);
  }

  function deleteProgress(progressId) {
    setProgress(progress.filter((item) => item.id !== progressId));
    if (editingId === progressId) {
      setForm(emptyProgress);
      setEditingId(null);
    }
  }

  function editProgress(item) {
    setEditingId(item.id);
    setForm({
      weekStart: item.weekStart,
      weight: String(item.weight),
      chest: item.chest === "" ? "" : String(item.chest),
      waist: item.waist === "" ? "" : String(item.waist),
      hip: item.hip === "" ? "" : String(item.hip),
    });
    setErrors([]);
  }

  return (
    <>
      <PageHeader eyebrow="İlerleme" title="Haftalık kilo değişimi" />
      <section className="panel progress-delta">
        <div>
          <p className="eyebrow">Son değişim</p>
          <h2>{weightDiff === null ? "Karşılaştırma için en az iki kayıt gerekir" : `${weightDiff > 0 ? "+" : ""}${weightDiff} kg`}</h2>
        </div>
        <p>{latestProgress ? `Son kayıt: ${formatDate(latestProgress.weekStart)} · ${latestProgress.weight} kg` : "Henüz ilerleme kaydı eklenmedi."}</p>
      </section>
      <section className="two-column">
        <FormPanel title={editingId ? "İlerleme kaydını düzenle" : "Haftalık kayıt ekle"} errors={errors} onSubmit={submit}>
          <Field label="Hafta başlangıcı">
            <input type="date" value={form.weekStart} onChange={(event) => setForm({ ...form, weekStart: event.target.value })} />
          </Field>
          <Field label="Kilo kg">
            <input type="number" min="0" step="0.1" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} />
          </Field>
          <Field label="Göğüs cm (opsiyonel)">
            <input type="number" min="0" step="0.1" value={form.chest} onChange={(event) => setForm({ ...form, chest: event.target.value })} />
          </Field>
          <Field label="Bel cm (opsiyonel)">
            <input type="number" min="0" step="0.1" value={form.waist} onChange={(event) => setForm({ ...form, waist: event.target.value })} />
          </Field>
          <Field label="Kalça cm (opsiyonel)">
            <input type="number" min="0" step="0.1" value={form.hip} onChange={(event) => setForm({ ...form, hip: event.target.value })} />
          </Field>
          <div className="form-actions">
            {editingId ? (
              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setForm(emptyProgress);
                  setEditingId(null);
                  setErrors([]);
                }}
              >
                İptal
              </button>
            ) : null}
            <button className="primary-button" type="submit">{editingId ? "Değişiklikleri kaydet" : "İlerlemeyi kaydet"}</button>
          </div>
        </FormPanel>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Grafik</p>
              <h2>Kilo değişimi</h2>
            </div>
          </div>
          <div className="chart-panel">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 20, right: 18, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dde5dc" />
                  <XAxis dataKey="tarih" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={38} />
                  <Tooltip />
                  <Line type="monotone" dataKey="kilo" stroke="#2f9e5d" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-text">Grafik için henüz ilerleme eklenmedi.</p>
            )}
          </div>
        </article>
      </section>
      <ListPanel title="İlerleme listesi" empty="Henüz ilerleme kaydı eklenmedi.">
        {progress.length
          ? [...progress].reverse().map((item) => (
              <li className="activity-item" key={item.id}>
                <div>
                  <strong>{formatDate(item.weekStart)}</strong>
                  <span>Göğüs {item.chest || "-"} cm · Bel {item.waist || "-"} cm · Kalça {item.hip || "-"} cm</span>
                </div>
                <div className="list-actions">
                  <strong>{item.weight} kg</strong>
                  <button className="outline-button compact" type="button" onClick={() => editProgress(item)}>
                    Düzenle
                  </button>
                  <button className="danger-button compact" type="button" onClick={() => deleteProgress(item.id)}>
                    Sil
                  </button>
                </div>
              </li>
            ))
          : null}
      </ListPanel>
    </>
  );
}

function FormPanel({ title, errors, onSubmit, children }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Form</p>
          <h2>{title}</h2>
        </div>
      </div>
      {errors.length ? (
        <div className="error-box" role="alert">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      ) : null}
      <form className="data-form" onSubmit={onSubmit}>
        {children}
      </form>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}

function ListPanel({ title, empty, children }) {
  const hasItems = React.Children.count(children) > 0 && children;

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Liste</p>
          <h2>{title}</h2>
        </div>
      </div>
      <ul className="activity-list">{hasItems || <li className="empty-text">{empty}</li>}</ul>
    </article>
  );
}

createRoot(document.getElementById("root")).render(<App />);
