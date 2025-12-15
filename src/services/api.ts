import axios from 'axios';
import type { Article, User } from '../types';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const api = {
  likeArticle: async (articleId: string): Promise<void> => {
    await client.post(`/articles/${articleId}/like`);
  },

  unlikeArticle: async (articleId: string): Promise<void> => {
    await client.delete(`/articles/${articleId}/like`);
  },

  viewArticle: async (articleId: string): Promise<void> => {
    await client.post(`/articles/${articleId}/view`);
  },

  getLikedArticles: async (): Promise<Article[]> => {
    const response = await client.get('/articles/liked');
    return response.data.articles || [];
  },

  getHistory: async (): Promise<Article[]> => {
    const response = await client.get('/articles/history');
    return response.data.articles || [];
  },

  saveArticle: async (article: Article): Promise<void> => {
    await client.post('/articles', article);
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await client.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },
};
