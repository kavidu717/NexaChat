import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';


dotenv.config();


const app = express();

app.use(express.json());
app.use(cors())

connectDB();

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`backend app listening on port ${port}`)
})