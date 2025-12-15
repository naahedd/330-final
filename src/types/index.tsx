export interface Article {
  id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  url: string;
  extract: string;
  viewed_at?: string;
}

export interface UserInteraction {
  articleId: string;
  liked: boolean;
  viewed: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string | null;
  created_at: string;
}
