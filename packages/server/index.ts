import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import router from './routes';
import { sanitizeInput } from './middleware/sanitizeInput.middleware';

dotenv.config();
if (!process.env.OPENWEATHER_API_KEY || !process.env.OPENAI_API_KEY) {
   dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '.env') });
}

const app = express();
app.use(express.json());
app.use(sanitizeInput);
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log(`Server is running on http://localhost:${PORT}`);
});
