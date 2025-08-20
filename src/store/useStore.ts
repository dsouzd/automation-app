import { create } from 'zustand';

export interface LogEntry {
  step: number;
  action: string;
  selector: string;
  value?: string;
  result: 'success' | 'failed';
  timestamp: Date;
}

interface AppState {
  url: string;
  logs: LogEntry[];
  isExecuting: boolean;
  setUrl: (url: string) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setExecuting: (executing: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  url: '',
  logs: [],
  isExecuting: false,
  setUrl: (url) => set({ url }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setExecuting: (executing) => set({ isExecuting: executing }),
}));