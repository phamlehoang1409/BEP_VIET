const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jejqldbyvvdqrfmcvmtv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplanFsZGJ5dnZkcXJmbWN2bXR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY1OTg2OSwiZXhwIjoyMTA2MjM1ODY5fQ.jQyuurq093oP5xU5KojDyotHU65VjpeXbfSX1gMmcLc';

let supabase = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  console.log('✅ Supabase client initialized successfully');
} catch (err) {
  console.error('⚠️ Could not initialize Supabase client:', err.message);
}

module.exports = supabase;
