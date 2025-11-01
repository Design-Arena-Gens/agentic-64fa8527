"use client";

import { useEffect, useMemo, useState } from "react";

type HydrationSettings = {
  dailyGoal: number;
  reminderInterval: number;
  wakeStart: string;
  wakeEnd: string;
  notificationsEnabled: boolean;
};

type HydrationLogEntry = {
  id: string;
  amount: number;
  timestamp: string;
};

type HydrationState = {
  settings: HydrationSettings;
  log: HydrationLogEntry[];
};

const STORAGE_KEY = "hydrate_plus_state_v1";

const defaultState: HydrationState = {
  settings: {
    dailyGoal: 2000,
    reminderInterval: 120,
    wakeStart: "07:00",
    wakeEnd: "22:00",
    notificationsEnabled: false
  },
  log: []
};

function loadState(): HydrationState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    const parsed = JSON.parse(raw) as HydrationState;
    return {
      settings: { ...defaultState.settings, ...parsed.settings },
      log: parsed.log?.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp
      })) ?? []
    };
  } catch (error) {
    console.error("Failed to parse hydration state", error);
    return defaultState;
  }
}

function saveState(nextState: HydrationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function isWithinSchedule(date: Date, settings: HydrationSettings) {
  const [startHour, startMinute] = settings.wakeStart.split(":").map(Number);
  const [endHour, endMinute] = settings.wakeEnd.split(":").map(Number);

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getTodayTotal(log: HydrationLogEntry[]) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return log
    .filter((entry) => new Date(entry.timestamp) >= startOfDay)
    .reduce((acc, entry) => acc + entry.amount, 0);
}

export default function HomePage() {
  const [hydrationState, setHydrationState] = useState<HydrationState>(defaultState);
  const [hydrationLoaded, setHydrationLoaded] = useState(false);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setHydrationState(loadState());
    setHydrationLoaded(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState("unsupported");
    }
  }, []);

  useEffect(() => {
    if (!hydrationLoaded) return;
    saveState(hydrationState);
  }, [hydrationState, hydrationLoaded]);

  const todayTotal = useMemo(() => getTodayTotal(hydrationState.log), [hydrationState.log]);
  const progress = Math.min(100, Math.round((todayTotal / hydrationState.settings.dailyGoal) * 100));

  useEffect(() => {
    if (!hydrationLoaded) return;

    const { settings, log } = hydrationState;
    if (!settings.notificationsEnabled) {
      setNextReminder(null);
      return;
    }

    if (permissionState === "default") {
      Notification.requestPermission().then((permission) => {
        setPermissionState(permission);
      });
    }

    if (permissionState !== "granted") {
      setNextReminder(null);
      return;
    }

    const lastIntakeDate = log.length > 0 ? new Date(log[log.length - 1].timestamp) : null;
    const baseDate = lastIntakeDate ?? new Date();
    const reminderDate = new Date(baseDate.getTime() + settings.reminderInterval * 60 * 1000);

    if (!isWithinSchedule(reminderDate, settings)) {
      const [startHour, startMinute] = settings.wakeStart.split(":").map(Number);
      reminderDate.setHours(startHour, startMinute, 0, 0);
      if (reminderDate <= new Date()) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
    }

    const delay = Math.max(0, reminderDate.getTime() - Date.now());
    const timeout = window.setTimeout(() => {
      if (permissionState === "granted") {
        new Notification("Waktunya minum air!", {
          body: "Jaga hidrasi tubuhmu dengan segelas air sekarang juga.",
          tag: "hydrate-plus-reminder"
        });
      }
      setNextReminder(new Date(Date.now() + settings.reminderInterval * 60 * 1000));
    }, delay);

    setNextReminder(reminderDate);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [hydrationState, hydrationLoaded, permissionState]);

  const quickAmounts = [120, 200, 250, 330];

  const addIntake = (amount: number) => {
    const entry: HydrationLogEntry = {
      id: crypto.randomUUID(),
      amount,
      timestamp: new Date().toISOString()
    };

    setHydrationState((prev) => ({
      ...prev,
      log: [...prev.log, entry]
    }));
  };

  const handleManualSubmit = () => {
    const amount = Number.parseInt(manualAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) return;
    addIntake(amount);
    setManualAmount("");
  };

  const updateSettings = (partial: Partial<HydrationSettings>) => {
    setHydrationState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial }
    }));
  };

  const dailyGoalLiters = (hydrationState.settings.dailyGoal / 1000).toFixed(1);
  const remaining = Math.max(hydrationState.settings.dailyGoal - todayTotal, 0);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <h1>Hydrate+</h1>
          <p>Pantau asupan air harian dan dapatkan pengingat otomatis agar tubuh tetap segar.</p>
        </div>
        <div className="summary-card">
          <div className="summary-value">{(todayTotal / 1000).toFixed(2)} L</div>
          <span>Minum Hari Ini</span>
        </div>
      </section>

      <section className="progress-section">
        <div className="progress-info">
          <div>
            <h2>Target Harian</h2>
            <p>{dailyGoalLiters} L</p>
          </div>
          <button
            className="secondary"
            onClick={() => {
              const recommendation = Math.round((70 * 30) / 100) * 100;
              updateSettings({ dailyGoal: recommendation });
            }}
          >
            Rekomendasi 2.1L
          </button>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-stats">
          <span>{progress}% tercapai</span>
          <span>Sisa {remaining} ml</span>
        </div>
      </section>

      <section className="intake-controls">
        <h2>Catat Minum</h2>
        <div className="quick-grid">
          {quickAmounts.map((amount) => (
            <button key={amount} className="quick-button" onClick={() => addIntake(amount)}>
              {amount} ml
            </button>
          ))}
        </div>
        <div className="manual-entry">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Jumlah (ml)"
            value={manualAmount}
            onChange={(event) => setManualAmount(event.target.value)}
          />
          <button className="primary" onClick={handleManualSubmit}>
            Tambah
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Pengaturan Pengingat</h2>
        <div className="settings-grid">
          <label>
            Target harian (ml)
            <input
              type="number"
              min={500}
              step={100}
              value={hydrationState.settings.dailyGoal}
              onChange={(event) => updateSettings({ dailyGoal: Number(event.target.value) })}
            />
          </label>
          <label>
            Interval pengingat (menit)
            <input
              type="number"
              min={15}
              step={15}
              value={hydrationState.settings.reminderInterval}
              onChange={(event) => updateSettings({ reminderInterval: Number(event.target.value) })}
            />
          </label>
          <label>
            Jam mulai aktif
            <input
              type="time"
              value={hydrationState.settings.wakeStart}
              onChange={(event) => updateSettings({ wakeStart: event.target.value })}
            />
          </label>
          <label>
            Jam selesai aktif
            <input
              type="time"
              value={hydrationState.settings.wakeEnd}
              onChange={(event) => updateSettings({ wakeEnd: event.target.value })}
            />
          </label>
        </div>
        <div className="notification-toggle">
          <input
            id="notification-toggle"
            type="checkbox"
            checked={hydrationState.settings.notificationsEnabled}
            onChange={(event) => {
              const enabled = event.target.checked;
              updateSettings({ notificationsEnabled: enabled });
              if (enabled && permissionState === "default" && "Notification" in window) {
                Notification.requestPermission().then((permission) => {
                  setPermissionState(permission);
                });
              }
            }}
          />
          <label htmlFor="notification-toggle">Aktifkan notifikasi desktop</label>
        </div>
        {permissionState === "denied" && (
          <p className="hint warning">Izin notifikasi ditolak. Aktifkan melalui pengaturan browser.</p>
        )}
        {permissionState === "unsupported" && (
          <p className="hint warning">Browser ini belum mendukung notifikasi.</p>
        )}
        {nextReminder && (
          <p className="hint">
            Pengingat berikutnya pada <strong>{formatTime(nextReminder)}</strong>
          </p>
        )}
      </section>

      <section className="history-section">
        <div className="history-header">
          <h2>Riwayat Hari Ini</h2>
          <button
            className="danger"
            onClick={() => {
              if (window.confirm("Hapus semua catatan minum hari ini?")) {
                setHydrationState((prev) => ({
                  ...prev,
                  log: prev.log.filter((entry) => {
                    const timestamp = new Date(entry.timestamp);
                    const now = new Date();
                    return !(
                      timestamp.getDate() === now.getDate() &&
                      timestamp.getMonth() === now.getMonth() &&
                      timestamp.getFullYear() === now.getFullYear()
                    );
                  })
                }));
              }
            }}
          >
            Reset hari ini
          </button>
        </div>
        {hydrationState.log.length === 0 ? (
          <p className="hint">Belum ada catatan. Mulailah dengan menambahkan segelas air.</p>
        ) : (
          <ul className="history-list">
            {hydrationState.log
              .slice()
              .reverse()
              .map((entry) => (
                <li key={entry.id}>
                  <span>{formatTime(new Date(entry.timestamp))}</span>
                  <strong>{entry.amount} ml</strong>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
