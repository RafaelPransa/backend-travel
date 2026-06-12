require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, 'localhost', () => {
  console.log(`Server is running strictly on http://localhost:${PORT}`);
});
