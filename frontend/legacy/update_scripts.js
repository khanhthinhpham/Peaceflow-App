const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const supabaseScripts = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n    <script src="js/supabase-config.js"></script>\n    <script src="js/app.js"></script>';

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('supabase-config.js')) {
    if (content.includes('<script src="js/app.js"></script>')) {
      content = content.replace('<script src="js/app.js"></script>', supabaseScripts);
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    }
  }
}
