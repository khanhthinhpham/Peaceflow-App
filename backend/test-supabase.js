const supabase = require('./supabase');

async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    if (error && error.code !== 'PGRST116' && error.message !== 'relation "_test" does not exist') {
       console.error('Connection error:', error.message);
    } else {
      console.log('Supabase connection successful!');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

testConnection();
