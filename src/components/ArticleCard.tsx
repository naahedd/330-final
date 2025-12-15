import { useEffect, useState } from 'react';
import type { Article } from '../types';
import { api } from '../services/api';

interface ArticleCardProps {
  article: Article;
  initiallyLiked?: boolean;
  isAuthenticated: boolean;
  onLikeChange?: (articleId: string, liked: boolean, article: Article) => void;
  onRequireLogin?: () => void;
}

export const ArticleCard = ({
  article,
  initiallyLiked = false,
  isAuthenticated,
  onLikeChange,
  onRequireLogin,
}: ArticleCardProps) => {
  const [liked, setLiked] = useState(initiallyLiked);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setLiked(initiallyLiked);
  }, [initiallyLiked]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }

    setWorking(true);
    try {
      if (liked) {
        await api.unlikeArticle(article.id);
        setLiked(false);
        onLikeChange?.(article.id, false, article);
      } else {
        await api.saveArticle(article);
        await api.likeArticle(article.id);
        setLiked(true);
        onLikeChange?.(article.id, true, article);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setWorking(false);
    }
  };

  const handleReadMore = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }

    try {
      await api.saveArticle(article);
      await api.viewArticle(article.id);
      window.open(article.url, '_blank');
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  return (
    <div className="h-full flex items-center justify-center px-8">
      <div className="max-w-3xl w-full space-y-6">
        {article.thumbnail && (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full max-h-[400px] object-cover rounded-lg"
            loading="lazy"
          />
        )}

        <h2 className="text-3xl font-semibold leading-tight text-white">
          {article.title}
        </h2>

        <p className="text-white/80 leading-relaxed line-clamp-6">
          {article.extract}
        </p>

        <div className="flex items-center gap-4 pt-4 flex-wrap">
          <button
            onClick={handleReadMore}
            className="px-4 py-2 rounded-md bg-white text-black text-sm hover:bg-white/80 transition"
          >
            Read article
          </button>
          <button
            onClick={handleLike}
            disabled={working}
            className={`px-4 py-2 rounded-md border text-sm transition ${liked ? 'bg-green-500 text-white border-green-500' : 'border-white/20 text-white hover:bg-white/10'}`}
          >
            {liked ? 'Saved' : 'Save'}
          </button>
          {!isAuthenticated && (
            <span className="text-xs text-white/60">Sign in to save and track reads</span>
          )}
        </div>
      </div>
    </div>
  );
};
