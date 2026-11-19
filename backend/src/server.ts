import 'dotenv/config';
import { createApp } from './app';

const port = Number(process.env.PORT || 3001);
const app = createApp();

app.listen(port, '0.0.0.0', () => {
  console.log(`[tiago-ai] API escutando em http://localhost:${port}`);
});
