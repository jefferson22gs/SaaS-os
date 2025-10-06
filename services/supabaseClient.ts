// The Supabase client is loaded from a CDN in index.html and available on the window object.
// This file centralizes its initialization.

let supabaseClientInstance: any = null;

/**
 * Gets the Supabase client instance, initializing it on the first call.
 * This function is designed to be called within a React component's lifecycle
 * to avoid race conditions with the Supabase script loaded from the CDN.
 * @returns The Supabase client instance or null if initialization fails.
 */
export const getSupabaseClient = () => {
    if (supabaseClientInstance) {
        return supabaseClientInstance;
    }

    // @ts-ignore - supabase is loaded globally from CDN
    const createClient = window.supabase?.createClient;
    
    if (!createClient) {
        // This can happen if the Supabase script hasn't loaded yet.
        console.error("Supabase client library not loaded. Make sure the script is in your index.html.");
        return null; 
    }

    // Using the hardcoded proxy URL as found in the project.
    // In a production environment, this should come from environment variables.
    const supabaseUrl: string = 'https://silent-mountain-a9f6.jefferson-22gs.workers.dev';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsc2F3dWZubWtkc3JqdmdwcXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTQyNjIsImV4cCI6MjA3NTA3MDI2Mn0.oaPd0k0B5iTpv--FeG8-ptSpdp3JtE7PRugS1k9UpQI';
    
    supabaseClientInstance = createClient(supabaseUrl, supabaseKey);
    
    return supabaseClientInstance;
};
