// ==========================================
// API helper — works with YOUR OWN Supabase project
// ==========================================
// When self-hosting, set these env vars:
//   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

const getBaseUrl = () => {
  // Use VITE_SUPABASE_URL which points to your own Supabase project
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) return `${supabaseUrl}/functions/v1`;
  // Fallback: construct from project ID
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId) return `https://${projectId}.supabase.co/functions/v1`;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID');
};

const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
});

export async function apiChat(message: string, conversationHistory: any[], role: string | null, sessionToken: string | null, userId: string | null, userEmail: string | null, socialStoriesMode: boolean = false) {
  const response = await fetch(`${getBaseUrl()}/chat`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ message, conversationHistory, role, sessionToken, userId, userEmail, socialStoriesMode }),
  });
  return response.json();
}

export async function apiVerifyAdmin(secretKey: string) {
  const response = await fetch(`${getBaseUrl()}/verify-admin`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ secretKey }),
  });
  return response.json();
}

export async function apiVerifySession(role: string, sessionToken: string) {
  const response = await fetch(`${getBaseUrl()}/verify-session`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ role, sessionToken }),
  });
  return response.json();
}

export async function apiContact(name: string, email: string, message: string) {
  const response = await fetch(`${getBaseUrl()}/contact`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ name, email, message }),
  });
  return response.json();
}

export async function apiCheckEmailExists(email: string) {
  const response = await fetch(`${getBaseUrl()}/check-email-exists`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ email }),
  });
  return response.json();
}
