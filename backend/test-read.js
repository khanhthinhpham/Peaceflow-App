import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking .env at:', envPath);
if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Content starts with:', content.substring(0, 20));
} else {
    console.log('File does NOT exist.');
}
