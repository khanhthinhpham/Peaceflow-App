const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const scriptsToInject = `
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-config.js"></script>
    <script src="js/app.js"></script>
</body>`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('js/app.js')) {
    if (content.includes('</body>')) {
      let replacement = scriptsToInject;
      if (content.includes('supabase-config.js')) {
        replacement = `\n    <script src="js/app.js"></script>\n</body>`;
      }
      content = content.replace('</body>', replacement);
      fs.writeFileSync(file, content);
      console.log('Injected scripts into ' + file);
    }
  }
}
