import { useState } from 'react';
import type { User } from '../types';

interface HeaderProps {
  onSearch: (query: string) => void;
  onRandomize: () => void;
  activeView: 'browse' | 'saved';
  onChangeView: (view: 'browse' | 'saved') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header = ({
  onSearch,
  onRandomize,
  activeView,
  onChangeView,
  user,
  onLogin,
  onLogout,
}: HeaderProps) => {
  const [query, setQuery] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold tracking-wide">
            WikiTok
          </span>
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onChangeView('browse')}
              className={`text-sm px-3 py-1.5 rounded-md border border-white/10 hover:border-white/30 transition ${activeView === 'browse' ? 'bg-white/10 text-white' : 'text-white/70'}`}
            >
              Browse
            </button>
            <button
              onClick={() => onChangeView('saved')}
              className={`text-sm px-3 py-1.5 rounded-md border border-white/10 hover:border-white/30 transition ${activeView === 'saved' ? 'bg-white/10 text-white' : 'text-white/70'}`}
            >
              Saved
            </button>
          </nav>
        </div>

        {activeView === 'browse' && (
          <form onSubmit={submit} className="flex-1">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Wikipedia"
              className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </form>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onRandomize}
            className="text-sm px-3 py-2 border border-white/20 rounded-md hover:bg-white/10 transition"
          >
            Random
          </button>
          {user ? (
            <>
              <span className="hidden md:block text-xs text-white/60">
                {user.username || user.email}
              </span>
              <button
                onClick={onLogout}
                className="text-sm px-3 py-2 bg-white text-black rounded-md hover:bg-white/80 transition"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="text-sm px-3 py-2 bg-white text-black rounded-md hover:bg-white/80 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
