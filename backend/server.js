import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import http from 'http';
import userRoutes from './src/routes/userRoutes.js';
import authRoutes from './src/routes/authRoutes.js';


dotenv.config();


const app = express();
const server=http.createServer(app);

app.use(express.json());
app.use(cors())

connectDB();

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use("/api/auth",userRoutes)
app.use("/api/users",authRoutes)

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`backend app listening on port ${port}`)
})