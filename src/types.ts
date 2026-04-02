export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  skillLevel?: SkillLevel;
  createdAt: string;
}

export interface RunRecord {
  id?: string;
  userId: string;
  distance: number;
  duration: number;
  pace: string;
  timestamp: string;
}

export interface CommunityPost {
  id?: string;
  userId: string;
  content: string;
  authorName?: string;
  authorPhoto?: string;
  likes: string[];
  timestamp: string;
}

export interface Recipe {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  difficulty?: string;
  time?: string;
  timestamp: string;
}
