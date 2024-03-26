import express from 'express';
import userRoutes from './routes/userRoutes'
import tweetRoutes from './routes/tweetRoutes'
import authRoutes from './routes/authRoutes'
import { authenticatieToken } from './middlewares/authMiddleware';

const app = express();
app.use(express.json());
app.use('/user', authenticatieToken, userRoutes);
app.use('/tweet', authenticatieToken, tweetRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Hello "updated" world!');
});

app.listen(3000, () => {
    console.log('Server ready at localhost:3000');
});