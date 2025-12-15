import { useCallback, useEffect, useRef, useState } from 'react';
import { ArticleCard } from './components/ArticleCard';
import { Header } from './components/Header';
import { Loading } from './components/Loading';
import type { Article, User } from './types';
import { fetchRandomArticles, searchArticles } from './services/wikipedia';
import { api } from './services/api';

type ViewMode = 'browse' | 'saved';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  const initialLoad = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };

    loadUser();
  }, []);

  const loadArticles = useCallback(async (isSearch: boolean = false, query?: string) => {
    setLoading(true);
    setError(null);

    try {
      const newArticles = isSearch && query
        ? await searchArticles(query)
        : await fetchRandomArticles(20);

      if (newArticles.length === 0) {
        setError('No articles found.');
        setLoading(false);
        return;
      }

      setArticles(newArticles);
      hasScrolled.current = false;

      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoad.current) return;
    initialLoad.current = true;
    loadArticles();
  }, [loadArticles]);

  const refreshSavedArticles = useCallback(async () => {
    if (!user) return;
    setSavedLoading(true);
    try {
      const liked = await api.getLikedArticles();
      setSavedArticles(liked);
      setLikedIds(new Set(liked.map((item) => item.id)));
    } catch (err) {
      setError('Unable to load saved articles.');
    } finally {
      setSavedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshSavedArticles();
    } else {
      setSavedArticles([]);
      setLikedIds(new Set());
    }
  }, [user, refreshSavedArticles]);

  const loadMoreArticles = useCallback(async () => {
    if (isLoadingMore || articles.length === 0 || viewMode !== 'browse') {
      return;
    }

    setIsLoadingMore(true);

    try {
      const more = await fetchRandomArticles(10);
      setArticles((prev) => [...prev, ...more]);
    } catch (err) { //er
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, articles.length, viewMode]);

  useEffect(() => {
    if (viewMode !== 'browse') return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!hasScrolled.current && container.scrollTop > 0) {
        hasScrolled.current = true;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (hasScrolled.current && distanceFromBottom < 1500 && !isLoadingMore) {
        loadMoreArticles();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreArticles, isLoadingMore, viewMode]);

  const handleSearch = (query: string) => {
    setViewMode('browse');
    loadArticles(true, query);
  };

  const handleRandomize = () => {
    setViewMode('browse');
    loadArticles(false);
  };

  const handleLogin = () => {
  console.log('LOGIN CLICKED');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  window.location.href = `${API_BASE_URL}/api/auth/login`;
};


  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSavedArticles([]);
    setLikedIds(new Set());
  };

  const handleLikeChange = (articleId: string, liked: boolean, article: Article) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) {
        next.add(articleId);
      } else {
        next.delete(articleId);
      }
      return next;
    });

    setSavedArticles((prev) => {
      if (liked) {
        const exists = prev.find((item) => item.id === articleId);
        if (exists) return prev;
        return [...prev, article];
      }
      return prev.filter((item) => item.id !== articleId);
    });
  };

  const handleRemoveSaved = async (article: Article) => {
    try {
      await api.unlikeArticle(article.id);
      handleLikeChange(article.id, false, article);
    } catch (err) {
      setError('Could not remove saved article.');
    }
  };

  const handleOpenSaved = async (article: Article) => {
    try {
      await api.viewArticle(article.id);
      window.open(article.url, '_blank');
    } catch (err) {
      // ignore
    }
  };

  if (loading && articles.length === 0 && viewMode === 'browse') {
    return <Loading />;
  }

  if (error && viewMode === 'browse' && articles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="border border-white/10 rounded-lg p-6 text-center max-w-md">
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={() => loadArticles()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      <Header
        onSearch={handleSearch}
        onRandomize={handleRandomize}
        activeView={viewMode}
        onChangeView={setViewMode}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {viewMode === 'saved' ? (
        <div className="flex-1 overflow-y-auto">
          {user ? (
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Library</p>
                  <h1 className="text-2xl font-semibold text-white">Saved articles</h1>
                </div>
                <button
                  onClick={refreshSavedArticles}
                  className="px-4 py-2 text-sm border border-white/20 rounded-md hover:bg-white/10 transition"
                >
                  Refresh
                </button>
              </div>

              {savedLoading ? (
                <div className="text-center text-white/70">Loading saved articles...</div>
              ) : savedArticles.length === 0 ? (
                <div className="border border-white/10 rounded-lg p-6 text-center text-white/70">
                  Nothing saved yet. Browse and tap &ldquo;Save&rdquo; to add articles.
                </div>
              ) : (
                <div className="space-y-4">
                  {savedArticles.map((article) => (
                    <div
                      key={article.id}
                      className="border border-white/10 rounded-lg p-4 flex gap-4 items-start bg-white/5"
                    >
                      {article.thumbnail && (
                        <img
                          src={article.thumbnail}
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                        <p className="text-sm text-white/70 line-clamp-3">
                          {article.summary || article.extract}
                        </p>
                        <div className="flex items-center gap-3 pt-2 flex-wrap">
                          <button
                            onClick={() => handleOpenSaved(article)}
                            className="px-3 py-1.5 text-sm rounded-md bg-white text-black hover:bg-white/80 transition"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleRemoveSaved(article)}
                            className="px-3 py-1.5 text-sm rounded-md border border-white/30 text-white hover:bg-white/10 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <p className="text-white/80 mb-4">Sign in to view your saved articles.</p>
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-white/80 transition"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {articles.length === 0 ? (
            <div className="h-screen flex items-center justify-center">
              <p className="text-white/50">No articles to display</p>
            </div>
          ) : (
            <>
              {articles.map((article, index) => (
                <section
                  key={`${article.id}-${index}`}
                  className="h-screen snap-start snap-always"
                >
                  <ArticleCard
                    article={article}
                    initiallyLiked={likedIds.has(article.id)}
                    isAuthenticated={Boolean(user)}
                    onLikeChange={handleLikeChange}
                    onRequireLogin={handleLogin}
                  />
                </section>
              ))}

              <div className="h-screen flex items-center justify-center">
                {isLoadingMore ? (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-red-500 mb-4" />
                    <p className="text-white/70">Loading more articles...</p>
                  </div>
                ) : (
                  <p className="text-white/50">Scroll down for more</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
