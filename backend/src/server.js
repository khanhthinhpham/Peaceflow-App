import app from './app.js';
import { env } from './config/env.js';

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // BẮT BUỘC PHẢI THÊM DÒNG NÀY

app.listen(PORT, HOST, () => {
    console.log(`🚀 PeaceFlow API running perfectly on http://${HOST}:${PORT}`);
});