
export enum UserRole {
  DEVOTEE = 'DEVOTEE',
  ADMIN = 'ADMIN'
}

export enum Language {
  EN = 'EN',
  GU = 'GU'
}

export interface MediaItem {
  id: string;
  title: string;
  artist?: string; // Optional field
  type: 'bhajan';
  uploader: string;
  timestamp: number;
  lyrics: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: 'event' | 'system' | 'media';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
