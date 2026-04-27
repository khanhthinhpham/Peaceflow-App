const fs = require('fs');
const path = require('path');
const dir = 'frontend/pages';

fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.html')) {
        const p = path.join(dir, f);
        let c = fs.readFileSync(p, 'utf8');
        
        // Fix relative paths to CSS/JS
        c = c.replace(/href="css\//g, 'href="../public/css/');
        c = c.replace(/src="js\//g, 'src="../public/js/');
        
        // Remove direct Supabase/app.js scripts from bottom if we want to use modules
        // But for index.html let's just fix the paths for now.
        
        fs.writeFileSync(p, c, 'utf8');
    }
});
console.log('Fixed paths in all HTML files');
