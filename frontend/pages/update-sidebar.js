const fs = require('fs');
const path = require('path');

const dir = 'c:/Dự án/PeaceFlow.vn/frontend/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if it already has mood-assessment in the sidebar
    if (content.includes('href="mood-assessment.html" class="nav-item')) {
        console.log('Skipping ' + file + ', already has mood-assessment in sidebar');
        if (file === 'mood-assessment.html') {
            content = content.replace(/<a href="mood-assessment\.html" class="nav-item *">/g, '<a href="mood-assessment.html" class="nav-item active">');
            fs.writeFileSync(filePath, content);
        }
        continue;
    }

    const singleLineMatch = /(<a href="mood-checkin\.html"[^>]*>💭 Tâm trạng<\/a>)/;
    const multiLineMatch = /(<a href="mood-checkin\.html"[^>]*>[\s\S]*? Tâm trạng[\s\S]*?<\/a>)/;

    let isActive = file === 'mood-assessment.html' ? ' active' : ' ';

    if (singleLineMatch.test(content)) {
        let singleItem = '\n            <a href="mood-assessment.html" class="nav-item' + isActive + '">📋 Bài kiểm tra</a>';
        content = content.replace(singleLineMatch, '$1' + singleItem);
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file + ' (single-line)');
    } else if (multiLineMatch.test(content)) {
        let newItem = '\n            <a href="mood-assessment.html" class="nav-item' + isActive + '">\n                <span class="ni">📋</span> Bài kiểm tra\n            </a>';
        content = content.replace(multiLineMatch, '$1' + newItem);
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file + ' (multi-line)');
    } else {
        console.log('Could not find target in ' + file);
    }
}
