"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  Block,
  CreateInput,
  Meetup,
  Preferences,
  Report,
  Result,
} from "@/domain/catalog";
import { messages } from "@/domain/messages";
import { createBrowserRepository } from "@/data/local-demo-repository";
import type { DemoSnapshot, MeetupRepository } from "@/data/repository";

type Flash = { tone: "success" | "error"; text: string };

type View = {
  snapshot: DemoSnapshot;
  flash: Flash | null;
};

type DemoStore = {
  subscribe: (listener: () => void) => () => void;
  getView: () => View;
  tick: (now: Date) => void;
  dismissFlash: () => void;
  setPreferences: (preferences: Preferences) => Result<DemoSnapshot>;
  saveName: (name: string) => Result<DemoSnapshot>;
  create: (input: CreateInput) => Result<Meetup>;
  join: (id: string) => Result<Meetup>;
  leave: (id: string) => Result<Meetup>;
  cancel: (id: string) => Result<Meetup>;
  report: (id: string, reasonId: string) => Result<Report>;
  block: (participantId: string) => Result<Block>;
  reset: () => void;
};

type DemoApi = {
  ready: boolean;
  snapshot: DemoSnapshot | null;
  flash: Flash | null;
  dismissFlash: () => void;
  setPreferences: (preferences: Preferences) => void;
  saveName: (name: string) => Result<DemoSnapshot>;
  create: (input: CreateInput) => Result<Meetup>;
  join: (id: string) => Result<Meetup>;
  leave: (id: string) => Result<Meetup>;
  cancel: (id: string) => Result<Meetup>;
  report: (id: string, reasonId: string) => Result<Report>;
  block: (participantId: string) => Result<Block>;
  reset: () => void;
};

const DemoContext = createContext<DemoApi | null>(null);

function unavailable(): Result<never> {
  return { ok: false, error: { code: "storage", message: messages.storage } };
}

function createDemoStore(repo: MeetupRepository): DemoStore {
  let now = new Date();
  let flash: Flash | null = null;
  let view: View = { snapshot: repo.read(now), flash };
  const listeners = new Set<() => void>();

  function emit() {
    view = { snapshot: repo.read(now), flash };
    listeners.forEach((listener) => listener());
  }

  function commit<T>(result: Result<T>, success?: string): Result<T> {
    if (!result.ok) {
      if (!result.error.fields) {
        flash = { tone: "error", text: result.error.message };
        emit();
      }
      return result;
    }
    now = new Date();
    if (success) flash = { tone: "success", text: success };
    emit();
    return result;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getView: () => view,
    tick(next) {
      now = next;
      emit();
    },
    dismissFlash() {
      flash = null;
      emit();
    },
    setPreferences(preferences) {
      return commit(repo.setPreferences(preferences, new Date()));
    },
    saveName(name) {
      return commit(repo.setDisplayName(name, new Date()));
    },
    create(input) {
      const result = repo.create(input, new Date());
      if (!result.ok) return result;
      now = new Date();
      flash = { tone: "success", text: "Gespeichert, nur auf diesem Gerät." };
      emit();
      return result;
    },
    join(id) {
      return commit(repo.join(id, new Date()), "Du bist dabei. Gespeichert nur in diesem Browser.");
    },
    leave(id) {
      return commit(repo.leave(id, new Date()), "Zusage zurückgenommen.");
    },
    cancel(id) {
      return commit(repo.cancel(id, new Date()), "Treffen abgesagt.");
    },
    report(id, reasonId) {
      return commit(
        repo.report(id, reasonId, new Date()),
        "Gemeldet. Das bleibt auf diesem Gerät, niemand prüft es.",
      );
    },
    block(participantId) {
      return commit(repo.block(participantId, new Date()), "Ausgeblendet, nur auf diesem Gerät.");
    },
    reset() {
      repo.reset(new Date());
      now = new Date();
      flash = { tone: "success", text: "Demo in diesem Browser zurückgesetzt." };
      emit();
    },
  };
}

export function useDemo(): DemoApi {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider fehlt");
  return value;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<DemoStore | null>(null);
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const next = createDemoStore(createBrowserRepository(window.localStorage));
    const unsubscribe = next.subscribe(() => setView(next.getView()));
    const start = window.setTimeout(() => {
      setStore(next);
      setView(next.getView());
    }, 0);
    const onFocus = () => next.tick(new Date());
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => next.tick(new Date()), 30_000);
    return () => {
      unsubscribe();
      window.clearTimeout(start);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, []);

  const api = useMemo<DemoApi>(() => {
    return {
      ready: view !== null,
      snapshot: view?.snapshot ?? null,
      flash: view?.flash ?? null,
      dismissFlash() {
        store?.dismissFlash();
      },
      setPreferences(preferences) {
        if (!store) return;
        const result = store.setPreferences(preferences);
        if (!result.ok) return;
      },
      saveName(name) {
        if (!store) return unavailable();
        return store.saveName(name);
      },
      create(input) {
        if (!store) return unavailable();
        return store.create(input);
      },
      join(id) {
        if (!store) return unavailable();
        return store.join(id);
      },
      leave(id) {
        if (!store) return unavailable();
        return store.leave(id);
      },
      cancel(id) {
        if (!store) return unavailable();
        return store.cancel(id);
      },
      report(id, reasonId) {
        if (!store) return unavailable();
        return store.report(id, reasonId);
      },
      block(participantId) {
        if (!store) return unavailable();
        return store.block(participantId);
      },
      reset() {
        store?.reset();
      },
    };
  }, [store, view]);

  return <DemoContext.Provider value={api}>{children}</DemoContext.Provider>;
}
