/**
 * API Abstraction Layer
 * This provides a clean interface for data operations.
 * To switch cloud providers, only this file needs to change.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Type definitions for external use
export type Profile = Tables<'profiles'> & { role?: 'admin' | 'participant' };
export type BaselineData = Tables<'baseline_data'>;
export type WeeklySubmission = Tables<'weekly_submissions'>;
export type AdminConfig = Tables<'admin_config'>;

// Auth operations
export const authApi = {
  async signUp(data: {
    email: string;
    password: string;
    name: string;
    country: string;
    city: string;
    cohort?: string;
    consentGiven: boolean;
  }) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          country: data.country,
          city: data.city,
          cohort: data.cohort || '',
          consent_given: data.consentGiven,
        },
      },
    });
    if (error) throw error;
    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

// Profile operations
export const profileApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return { ...profile, role: roleData?.role || 'participant' };
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    // Get all roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    return profiles.map(p => ({
      ...p,
      role: roleMap.get(p.user_id) || 'participant',
    }));
  },

  async getParticipants(): Promise<Profile[]> {
    const profiles = await this.getAllProfiles();
    return profiles.filter(p => p.role === 'participant');
  },
};

// Baseline operations
export const baselineApi = {
  async getBaseline(userId: string): Promise<BaselineData | null> {
    const { data, error } = await supabase
      .from('baseline_data')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching baseline:', error);
    }
    return data;
  },

  async submitBaseline(data: Omit<BaselineData, 'id' | 'submitted_at'>): Promise<void> {
    const { error } = await supabase
      .from('baseline_data')
      .upsert(data, { onConflict: 'user_id' });
    
    if (error) throw error;
  },

  async getAllBaselines(): Promise<BaselineData[]> {
    const { data, error } = await supabase
      .from('baseline_data')
      .select('*');
    
    if (error) {
      console.error('Error fetching baselines:', error);
      return [];
    }
    return data;
  },
};

// Weekly submission operations
export const weeklyApi = {
  async getSubmissions(userId: string): Promise<WeeklySubmission[]> {
    const { data, error } = await supabase
      .from('weekly_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
    return data;
  },

  async getAllSubmissions(): Promise<WeeklySubmission[]> {
    const { data, error } = await supabase
      .from('weekly_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all submissions:', error);
      return [];
    }
    return data;
  },

  async submitWeekly(data: Omit<WeeklySubmission, 'id' | 'submitted_at'>): Promise<void> {
    const { error } = await supabase
      .from('weekly_submissions')
      .upsert(data, { onConflict: 'user_id,week_number' });
    
    if (error) throw error;
  },

  async getNextWeekNumber(userId: string): Promise<number> {
    const submissions = await this.getSubmissions(userId);
    if (submissions.length === 0) return 1;
    return Math.max(...submissions.map(s => s.week_number)) + 1;
  },
};

// Admin config operations
export const adminApi = {
  async getConfig(): Promise<AdminConfig | null> {
    const { data, error } = await supabase
      .from('admin_config')
      .select('*')
      .single();
    
    if (error) {
      console.error('Error fetching admin config:', error);
      return null;
    }
    return data;
  },

  async updateConfig(co2Multiplier: number): Promise<void> {
    const { error } = await supabase
      .from('admin_config')
      .update({ co2_multiplier_per_gb: co2Multiplier })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
    
    if (error) throw error;
  },

  async exportCSV(participants: Profile[], submissions: WeeklySubmission[], config: AdminConfig): Promise<string> {
    const headers = ['Name', 'Email', 'Country', 'City', 'Cohort', 'Total GB Deleted', 'Weeks Submitted', 'CO2 Avoided (kg)'];
    const rows = participants.map(p => {
      const pSubs = submissions.filter(s => s.user_id === p.user_id);
      const pGB = pSubs.reduce((s, w) => s + Number(w.gb_deleted), 0);
      return [
        p.name,
        p.email,
        p.country,
        p.city,
        p.cohort || '',
        pGB.toFixed(1),
        pSubs.length.toString(),
        (pGB * Number(config.co2_multiplier_per_gb)).toFixed(3),
      ];
    });
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },
};
