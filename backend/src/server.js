import app from './app.js';

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 PeaceFlow API running perfectly on http://${HOST}:${PORT}`);
});
