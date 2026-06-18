import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import http from 'http';
import userRoutes from './src/routes/userRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import {app,server} from './src/utils/sockts.js'


dotenv.config();





app.use(express.json());
app.use(cors())

connectDB();

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use("/api/auth",userRoutes)
app.use("/api/users",authRoutes)
app.use("/api/messages",messageRoutes)






const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`backend app listening on port ${port}`)
})