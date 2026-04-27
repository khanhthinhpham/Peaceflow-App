require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * A lightweight Supabase client using native fetch.
 * No node_modules required (except dotenv if you want env vars).
 */
async function supabaseFetch(table, { method = 'GET', body = null, query = '' } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || response.statusText);
  }

  return data;
}

module.exports = supabaseFetch;
