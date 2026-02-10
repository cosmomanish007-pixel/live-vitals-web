export type SessionState = 'CREATED' | 'STARTED' | 'MONITORING' | 'COMPLETED' | 'ERROR';
export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';
export type Gender = 'Male' | 'Female' | 'Other';
export type SessionMode = 'Self' | 'Assisted';

export interface Session {
  id: string;
  user_id: string;
  user_name: string;
  age: number;
  gender: Gender;
  mode: SessionMode;
  state: SessionState;
  created_at: string;
}

export interface Status {
  id: string;
  session_id: string;
  message: string;
  created_at: string;
}

export interface Vital {
  id: string;
  session_id: string;
  temp: number | null;
  hr: number | null;
  spo2: number | null;
  audio: number | null;
  status: HealthStatus | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null };
        Update: { full_name?: string | null; avatar_url?: string | null };
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: { id?: string; user_id: string; user_name: string; age: number; gender: string; mode: string; state: string; created_at?: string };
        Update: { id?: string; user_id?: string; user_name?: string; age?: number; gender?: string; mode?: string; state?: string; created_at?: string };
        Relationships: [];
      };
      statuses: {
        Row: Status;
        Insert: { id?: string; session_id: string; message: string; created_at?: string };
        Update: { id?: string; session_id?: string; message?: string; created_at?: string };
        Relationships: [];
      };
      vitals: {
        Row: Vital;
        Insert: { id?: string; session_id: string; temp?: number | null; hr?: number | null; spo2?: number | null; audio?: number | null; status?: string | null; created_at?: string };
        Update: { id?: string; session_id?: string; temp?: number | null; hr?: number | null; spo2?: number | null; audio?: number | null; status?: string | null; created_at?: string };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
