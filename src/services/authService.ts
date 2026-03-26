// ============================================
// FN-10: User & Auth Management Service
// ============================================

import { supabase } from '../lib/supabase';
import type {
  User,
  UserRole,
  LoginResponse,
  PaginatedResponse,
} from '../types';

const USER_PROFILE_KEY = 'pos_user_profile';

interface CreateUserData {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  branch_id: number;
}

interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  branch_id?: number;
}

export const authService = {
  /**
   * Sign in with username and password.
   * Looks up the user's email from the users table (username@pos.local convention),
   * authenticates via Supabase Auth, then fetches the full profile.
   * Stores the profile in localStorage for RBAC routing.
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    // Convert username to email for Supabase Auth
    // Convention: username@posrestaurant.com
    const email = username.includes('@') ? username : `${username}@posrestaurant.com`;

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      throw new Error(authError.message);
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile: ' + profileError.message);
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error('Account is deactivated. Please contact a manager.');
    }

    // Store profile for RBAC routing
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    return {
      user: profile as User,
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    };
  },

  /**
   * Sign out the current user and clear stored profile.
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem(USER_PROFILE_KEY);
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Refresh the current session tokens.
   */
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  },

  /**
   * Get the currently authenticated user along with their profile from the users table.
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError) {
      return null;
    }

    // Keep localStorage in sync
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    return profile as User;
  },

  /**
   * Get the cached user profile from localStorage (synchronous, for RBAC checks).
   */
  getCachedProfile(): User | null {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  /**
   * Create a new user (manager-only).
   * Creates a Supabase Auth account then inserts a row into the users table.
   */
  async createUser(data: CreateUserData): Promise<User> {
    const email = `${data.username}@posrestaurant.com`;

    // Create auth account via signUp (admin.createUser requires service-role key)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: data.password,
    });

    if (authError) {
      throw new Error('Failed to create auth account: ' + authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth account: no user returned');
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        is_active: true,
        branch_id: data.branch_id,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error('Failed to create user profile: ' + profileError.message);
    }

    return profile as User;
  },

  /**
   * List users with pagination.
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<User>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error('Failed to fetch users: ' + error.message);
    }

    return {
      data: (data ?? []) as User[],
      total: count ?? 0,
      page,
      limit,
    };
  },

  /**
   * Update an existing user's profile fields.
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const { data: updated, error } = await supabase
      .from('users')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update user: ' + error.message);
    }

    return updated as User;
  },

  /**
   * Deactivate a user (soft-delete).
   */
  async deactivateUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to deactivate user: ' + error.message);
    }

    return data as User;
  },

  /**
   * Re-activate a previously deactivated user.
   */
  async activateUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to activate user: ' + error.message);
    }

    return data as User;
  },
};
