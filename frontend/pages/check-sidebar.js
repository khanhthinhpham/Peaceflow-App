const fs = require('fs');
const content = fs.readFileSync('c:/Dự án/PeaceFlow.vn/frontend/pages/dashboard.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('class="sidebar"') || line.includes("class='sidebar'")) {
    console.log('sidebar class at line ' + (i+1));
  }
});
