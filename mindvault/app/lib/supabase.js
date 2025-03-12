/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

// Get environment variables or use placeholders in development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
  (process.env.NODE_ENV === 'development' ? 'https://placeholder-url.supabase.co' : null)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  (process.env.NODE_ENV === 'development' ? 'placeholder-key' : null)

// In production, we still want to throw an error if the variables are missing
if (process.env.NODE_ENV !== 'development' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables')
}

// In development, we'll show a warning but still create a client with placeholders
if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Using placeholder Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)