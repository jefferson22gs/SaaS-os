// The Supabase client is loaded from a CDN in index.html and available on the window object.
// This file centralizes its initialization.

/*
 * ====================================================================================
 *  ACTION REQUIRED: FIX FOR CORS (Cross-Origin Resource Sharing) ERRORS
 * ====================================================================================
 * As of recent Supabase updates, CORS configurations must be handled via a proxy.
 * You need to create a simple proxy (e.g., using a free Cloudflare Worker) to
 * forward requests to Supabase and add the correct CORS headers. This will resolve
 * the "Failed to fetch" errors you are seeing.
 *
 * STEPS:
 * 1. Create a Cloudflare Worker (a free account is sufficient).
 * 2. Paste the provided proxy worker code (from our previous conversation) into it.
 * 3. Deploy the worker to get your unique URL (e.g., https://my-proxy.my-user.workers.dev).
 * 4. Replace the placeholder 'YOUR_PROXY_WORKER_URL_HERE' below with your actual worker URL.
 * ====================================================================================
 */
// const supabaseUrl = 'https://klsawufnmkdsrjvgpquk.supabase.co'; // This is the original URL, which is now blocked by CORS.
// FIX: Explicitly type supabaseUrl as string to prevent TypeScript from inferring a literal type, which caused a comparison error on line 31.
const supabaseUrl: string = 'https://silent-mountain-a9f6.jefferson-22gs.workers.dev'; // <-- IMPORTANT: REPLACE THIS WITH YOUR PROXY URL

// NOTE: Even when using a proxy, the Supabase client still needs the original anon key
// for authentication headers, which the proxy will forward.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsc2F3dWZubWtkc3JqdmdwcXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTQyNjIsImV4cCI6MjA3NTA3MDI2Mn0.oaPd0k0B5iTpv--FeG8-ptSpdp3JtE7PRugS1k9UpQI';

let supabaseClient;
// @ts-ignore - supabase is loaded globally from CDN
const createSupabaseClient = window.supabase?.createClient;

if (createSupabaseClient && supabaseUrl && supabaseUrl !== 'YOUR_PROXY_WORKER_URL_HERE') {
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey);
} else {
    supabaseClient = null;
}

export const supabase = supabaseClient;