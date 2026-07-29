import { Outlet, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { TopTabs } from './top-tabs';

export function AppShell() {
  const navigate = useNavigate();

  // Listen for main process navigation events (e.g. redirect to /setup)
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onNavigate((path: string) => {
      navigate(path);
    });
    return unsubscribe;
  }, [navigate]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f]">
      <TopTabs />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
