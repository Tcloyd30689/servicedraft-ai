export interface UserPreferences {
  appearance?: {
    accentColor: string;   // Key from themeColors.ts (e.g., 'violet', 'blue')
    mode: 'dark' | 'light';
    backgroundAnimation?: boolean; // Particle network on/off — undefined treated as true
  };
  templates?: {
    defaultFormat?: 'block' | 'ccc';
    defaultCustomization?: {
      tone?: string;
      warrantyCompliance?: boolean;
      detailLevel?: string;
    };
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  position: string | null;
  profile_picture_url: string | null;
  subscription_status: 'active' | 'trial' | 'expired' | 'bypass';
  stripe_customer_id: string | null;
  role: 'user' | 'admin';
  is_restricted: boolean;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  story_type: string | null;
  input_data: Record<string, unknown> | null;
  output_preview: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Narrative {
  id: string;
  user_id: string;
  ro_number: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  concern: string | null;
  cause: string | null;
  correction: string | null;
  full_narrative: string | null;
  story_type: 'diagnostic_only' | 'repair_complete';
  created_at: string;
  updated_at: string;
}
