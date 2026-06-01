export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_settings: {
        Row: {
          admin_email: string | null;
          id: number;
          updated_at: string;
        };
        Insert: {
          admin_email?: string | null;
          id?: number;
          updated_at?: string;
        };
        Update: {
          admin_email?: string | null;
          id?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          check_in: string;
          check_out: string;
          created_at: string;
          currency: string;
          guests: number;
          hotel_image: string | null;
          hotel_location: string;
          hotel_name: string;
          hotel_slug: string;
          id: string;
          nights: number;
          price_per_night_npr: number;
          status: string;
          stripe_payment_intent: string | null;
          stripe_session_id: string | null;
          total_npr: number;
          total_usd_cents: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          check_in: string;
          check_out: string;
          created_at?: string;
          currency?: string;
          guests: number;
          hotel_image?: string | null;
          hotel_location: string;
          hotel_name: string;
          hotel_slug: string;
          id?: string;
          nights: number;
          price_per_night_npr: number;
          status?: string;
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          total_npr: number;
          total_usd_cents: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          check_in?: string;
          check_out?: string;
          created_at?: string;
          currency?: string;
          guests?: number;
          hotel_image?: string | null;
          hotel_location?: string;
          hotel_name?: string;
          hotel_slug?: string;
          id?: string;
          nights?: number;
          price_per_night_npr?: number;
          status?: string;
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          total_npr?: number;
          total_usd_cents?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      checkpoints: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          lat: number;
          lng: number;
          name: string;
          place_id: string | null;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          lat: number;
          lng: number;
          name: string;
          place_id?: string | null;
          user_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          lat?: number;
          lng?: number;
          name?: string;
          place_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      guide_verifications: {
        Row: {
          created_at: string;
          full_name: string;
          guide_id_number: string;
          id: string;
          id_card_path: string;
          phone: string;
          place: string;
          review_note: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          guide_id_number: string;
          id?: string;
          id_card_path: string;
          phone: string;
          place: string;
          review_note?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          guide_id_number?: string;
          id?: string;
          id_card_path?: string;
          phone?: string;
          place?: string;
          review_note?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: string;
          business_type: string | null;
          created_at: string;
          first_name: string | null;
          full_name: string | null;
          gender: string;
          last_name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_type: string;
          business_type?: string | null;
          created_at?: string;
          first_name?: string | null;
          full_name?: string | null;
          gender: string;
          last_name?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_type?: string;
          business_type?: string | null;
          created_at?: string;
          first_name?: string | null;
          full_name?: string | null;
          gender?: string;
          last_name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_interests: {
        Row: {
          created_at: string;
          interests: string[];
          onboarded: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          interests?: string[];
          onboarded?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          interests?: string[];
          onboarded?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;
