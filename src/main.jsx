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

function useFitnessData() {
  const [profile, setProfileState] = useState(() => readProfile());
  const [workouts, setWorkoutsState] = useState(() => readWorkouts());
  const [nutrition, setNutritionState] = useState(() => readNutrition());
  const [progress, setProgressState] = useState(() => readProgress());

  const setProfile = (value) => {
    setProfileState(value);
    writeProfile(value);
  };

  const setWorkouts = (value) => {
    setWorkoutsState(value);
    writeWorkouts(value);
  };

  const setNutrition = (value) => {
    setNutritionState(value);
    writeNutrition(value);
  };

  const setProgress = (value) => {
    setProgressState(value);
    writeProgress(value);
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
  const data = useFitnessData();
  const [session, setSession] = useState(() => readAuthSession());

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
            {navItems.map((item) => (
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
            <strong>{session.name}</strong>
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordAgain: "" });
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
      onAuth({ userId: user.id, name: user.name, email: user.email });
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

    onAuth({ userId: registeredUser.id, name: registeredUser.name, email: registeredUser.email });
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
      </section>
    </main>
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

  useEffect(() => {
    if (profile) setForm(profile);
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
  }

  return (
    <>
      <PageHeader eyebrow="Profil" title="Kişisel bilgiler" meta="Tek kayıt" />
      <section className="two-column">
        <FormPanel title="Profil kaydet" errors={errors} onSubmit={submit}>
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
          <button className="primary-button" type="submit">Profili kaydet</button>
        </FormPanel>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Özet</p>
              <h2>Kaydedilen profil</h2>
            </div>
          </div>
          {profile ? (
            <div className="detail-list">
              <span><strong>Ad Soyad</strong>{profile.fullName}</span>
              <span><strong>Yaş</strong>{profile.age}</span>
              <span><strong>Boy</strong>{profile.height} cm</span>
              <span><strong>Kilo</strong>{profile.weight} kg</span>
              <span><strong>Hedef</strong>{formatGoal(profile.goal)}</span>
            </div>
          ) : (
            <p className="empty-text">Henüz profil eklenmedi.</p>
          )}
        </article>
      </section>
    </>
  );
}

function WorkoutPage({ workouts, setWorkouts }) {
  const [form, setForm] = useState(emptyWorkout);
  const [errors, setErrors] = useState([]);

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

    setWorkouts([
      ...workouts,
      {
        id: crypto.randomUUID(),
        exerciseName: form.exerciseName.trim(),
        sets: Number(form.sets),
        reps: Number(form.reps),
        duration: Number(form.duration),
        date: form.date,
      },
    ]);
    setForm(emptyWorkout);
    setErrors([]);
  }

  return (
    <>
      <PageHeader eyebrow="Antrenman" title="Egzersiz kayıtları" meta="/antrenman" />
      <section className="two-column">
        <FormPanel title="Antrenman ekle" errors={errors} onSubmit={submit}>
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
          <button className="primary-button" type="submit">Antrenmanı kaydet</button>
        </FormPanel>
        <ListPanel title="Antrenman listesi" empty="Henüz antrenman eklenmedi.">
          {workouts.length
            ? [...workouts].reverse().map((workout) => (
                <li className="activity-item" key={workout.id}>
                  <div>
                    <strong>{workout.exerciseName}</strong>
                    <span>{formatDate(workout.date)} · {workout.sets} set · {workout.reps} tekrar</span>
                  </div>
                  <strong>{workout.duration} dk</strong>
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
  const todayMeals = nutrition.filter((item) => item.date === todayIso());

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

    setNutrition([
      ...nutrition,
      {
        id: crypto.randomUUID(),
        mealName: form.mealName,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        date: form.date,
      },
    ]);
    setForm(emptyMeal);
    setErrors([]);
  }

  return (
    <>
      <PageHeader eyebrow="Beslenme" title="Öğün ve makro takibi" meta="/beslenme" />
      <section className="metrics nutrition-totals">
        <SummaryCard title="Bugün kalori" value={`${sumBy(todayMeals, "calories")} kcal`} detail="Seçili gün: bugün" tone="coral" />
        <SummaryCard title="Protein" value={`${sumBy(todayMeals, "protein")} g`} detail="Bugünün toplamı" tone="green" />
        <SummaryCard title="Karbonhidrat" value={`${sumBy(todayMeals, "carbs")} g`} detail="Bugünün toplamı" tone="blue" />
        <SummaryCard title="Yağ" value={`${sumBy(todayMeals, "fat")} g`} detail="Bugünün toplamı" tone="yellow" />
      </section>
      <section className="two-column">
        <FormPanel title="Beslenme kaydı ekle" errors={errors} onSubmit={submit}>
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
          <button className="primary-button" type="submit">Öğünü kaydet</button>
        </FormPanel>
        <ListPanel title="Beslenme listesi" empty="Henüz beslenme kaydı eklenmedi.">
          {nutrition.length
            ? [...nutrition].reverse().map((meal) => (
                <li className="activity-item" key={meal.id}>
                  <div>
                    <strong>{meal.mealName}</strong>
                    <span>{formatDate(meal.date)} · P {meal.protein}g · K {meal.carbs}g · Y {meal.fat}g</span>
                  </div>
                  <strong>{meal.calories} kcal</strong>
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
  const chartData = useMemo(
    () =>
      [...progress]
        .sort((a, b) => String(a.weekStart).localeCompare(String(b.weekStart)))
        .map((item) => ({ tarih: formatDate(item.weekStart), kilo: item.weight })),
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

    setProgress([
      ...progress,
      {
        id: crypto.randomUUID(),
        weekStart: form.weekStart,
        weight: Number(form.weight),
        chest: form.chest === "" ? "" : Number(form.chest),
        waist: form.waist === "" ? "" : Number(form.waist),
        hip: form.hip === "" ? "" : Number(form.hip),
      },
    ]);
    setForm(emptyProgress);
    setErrors([]);
  }

  return (
    <>
      <PageHeader eyebrow="İlerleme" title="Haftalık kilo değişimi" meta="/ilerleme" />
      <section className="two-column">
        <FormPanel title="Haftalık kayıt ekle" errors={errors} onSubmit={submit}>
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
          <button className="primary-button" type="submit">İlerlemeyi kaydet</button>
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
                <strong>{item.weight} kg</strong>
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
