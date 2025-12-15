import axios from 'axios';
import type { Article, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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