import express from 'express';
import secretHandler from './secret/index.js';

const app = express();
app.use(express.json());

app.post('/api/secret', secretHandler);

const port = 3001;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
