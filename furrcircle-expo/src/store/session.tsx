import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { careTasks as seedTasks } from "../data/mock";
import type { CareTask, Role } from "../data/types";

const KEY = "furrcircle.session.v1";

type Persisted = {
  signedIn: boolean;
  /** Roles this account holds. One person can be both an owner and a vet. */
  roles: Role[];
  /** The workspace currently on screen. */
  workspace: Role;
  activePetId: string;
  onboarded: boolean;
};

const initial: Persisted = {
  signedIn: false,
  roles: ["owner"],
  workspace: "owner",
  activePetId: "p_1",
  onboarded: false,
};

type SessionValue = Persisted & {
  ready: boolean;
  tasks: CareTask[];
  signIn: (roles: Role[]) => void;
  signOut: () => void;
  setWorkspace: (r: Role) => void;
  setActivePet: (id: string) => void;
  completeOnboarding: () => void;
  toggleTask: (id: string) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<CareTask[]>(seedTasks);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...initial, ...(JSON.parse(raw) as Partial<Persisted>) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const patch = useCallback((next: Partial<Persisted>) => {
    setState((prev) => {
      const merged = { ...prev, ...next };
      AsyncStorage.setItem(KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      ready,
      tasks,
      signIn: (roles) => patch({ signedIn: true, roles, workspace: roles[0] }),
      signOut: () => {
        AsyncStorage.removeItem(KEY).catch(() => {});
        setState(initial);
      },
      setWorkspace: (workspace) => patch({ workspace }),
      setActivePet: (activePetId) => patch({ activePetId }),
      completeOnboarding: () => patch({ onboarded: true }),
      toggleTask: (id) =>
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    }),
    [state, ready, tasks, patch],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
