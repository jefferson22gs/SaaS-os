// The Supabase client is loaded from a CDN in index.html and available on the window object.
// This file centralizes its initialization.

const supabaseUrl = 'https://klsawufnmkdsrjvgpquk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsc2F3dWZubWtkc3JqdmdwcXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTQyNjIsImV4cCI6MjA3NTA3MDI2Mn0.oaPd0k0B5iTpv--FeG8-ptSpdp3JtE7PRugS1k9UpQI';

// @ts-ignore - supabase is loaded globally from CDN
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
