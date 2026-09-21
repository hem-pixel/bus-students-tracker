// FILE: src/services/supabaseClient.js
// PURPOSE: Centralized Supabase client for V.S.B Engineering College (Dept. of AI & DS)
// Provides Supabase Client instance, authentication, real-time table subscriptions, and direct query utilities.
// PHASE: Supabase Migration (Phases 3 - 7)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ovhtvxveijutcpvnggqn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('[SupabaseClient] Warning: VITE_SUPABASE_ANON_KEY is not defined in environment variables.');
}

/**
 * Shared Supabase Client instance
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Real-time table subscription helper
 * Subscribes to changes on any table in the public schema
 * 
 * @param {string} table - Table name (e.g., 'buses', 'recognition_results', 'camera_events')
 * @param {function} onInsert - Callback when a row is inserted
 * @param {function} onUpdate - Callback when a row is updated
 * @param {function} onDelete - Callback when a row is deleted
 * @returns {object} subscription channel that can be unsubscribed via channel.unsubscribe()
 */
export function subscribeToTable(table, { onInsert, onUpdate, onDelete } = {}) {
  const channel = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
      if (onInsert) onInsert(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload) => {
      if (onUpdate) onUpdate(payload.new, payload.old);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (payload) => {
      if (onDelete) onDelete(payload.old);
    })
    .subscribe();

  return channel;
}

/**
 * Direct Supabase table query helper
 */
export const supabaseDb = {
  // Buses
  async getBuses() {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('bus_number', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Routes
  async getRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*, stops(*)')
      .order('route_number', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Real-time Camera Statuses
  async getCameras() {
    const { data, error } = await supabase
      .from('cameras')
      .select('*, buses(bus_number, registration_number)')
      .order('camera_code', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Live Recognition Results
  async getRecentRecognitions(limit = 50) {
    const { data, error } = await supabase
      .from('recognition_results')
      .select('*, students(full_name, register_number, department, year_of_study), cameras(camera_code)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  // Student Attendance Log
  async getAttendanceByDate(dateStr) {
    const { data, error } = await supabase
      .from('student_attendance_log')
      .select('*, students(full_name, register_number), buses(bus_number)')
      .eq('date', dateStr)
      .order('boarded_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

export default supabase;
