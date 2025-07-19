import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Database type definition (same as client-side)
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

export const createClient = () => {
  // Check if environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Return a mock client for build time
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        delete: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        upsert: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      }),
    } as any;
  }

  try {
    const cookieStore = cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  } catch {
    // Fallback for build time or when cookies are not available
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return undefined;
          },
          set(name: string, value: string, options: any) {
            // No-op for build time
          },
          remove(name: string, options: any) {
            // No-op for build time
          },
        },
      }
    );
  }
};