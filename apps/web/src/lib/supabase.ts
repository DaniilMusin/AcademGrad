import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// Database type definition
interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: number;
          user_id: string;
          goal_score?: number;
          weak_topics?: string[];
          tg_chat?: string;
          fcm_token?: string;
          onboarding_step?: number;
          completed_at?: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          goal_score?: number;
          weak_topics?: string[];
          tg_chat?: string;
          fcm_token?: string;
          onboarding_step?: number;
          completed_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          goal_score?: number;
          weak_topics?: string[];
          tg_chat?: string;
          fcm_token?: string;
          onboarding_step?: number;
          completed_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: number;
          user_id: string;
          total_xp: number;
          current_streak: number;
          longest_streak: number;
          last_activity: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity?: string;
        };
      };
      user_events: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string;
          event_type: string;
          is_draft: boolean;
        };
        Insert: {
          id?: number;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string;
          event_type: string;
          is_draft?: boolean;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string;
          event_type?: string;
          is_draft?: boolean;
        };
      };
      user_badges: {
        Row: {
          id: number;
          user_id: string;
          badge_id: number;
          given_at: string;
          badges: {
            id: number;
            code: string;
            title: string;
            icon: string;
          };
        };
        Insert: {
          id?: number;
          user_id: string;
          badge_id: number;
          given_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          badge_id?: number;
          given_at?: string;
        };
      };
      tasks: {
        Row: {
          id: number;
          topic: string;
          difficulty: number;
          statement_md: string;
        };
        Insert: {
          id?: number;
          topic: string;
          difficulty: number;
          statement_md: string;
        };
        Update: {
          id?: number;
          topic?: string;
          difficulty?: number;
          statement_md?: string;
        };
      };
      schedule_view: {
        Row: {
          user_id: string;
          topic: string;
          difficulty: number;
          next_review: string;
          priority: number;
          reason: string;
        };
      };
      leaderboard: {
        Row: {
          user_id: string;
          email: string;
          total_xp: number;
          current_streak: number;
          longest_streak: number;
          badge_count: number;
          xp_rank: number;
          streak_rank: number;
        };
      };
      group_leaderboard: {
        Row: {
          user_id: string;
          group_id: string;
          email: string;
          total_xp: number;
          current_streak: number;
          longest_streak: number;
          badge_count: number;
          xp_rank: number;
          streak_rank: number;
        };
      };
    };
    Functions: {
      get_personalized_recommendations: {
        Args: {
          p_user_id: string;
          p_limit: number;
        };
        Returns: Array<{
          task_id: number;
          exam: string;
          topic: string;
          subtopic: string | null;
          difficulty: number;
          statement_md: string;
          priority_score: number;
          recommendation_reason: string;
          priority_bucket: string;
        }>;
      };
    };
  };
}

export const createClient = () =>
  createPagesBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
