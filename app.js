require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { DataSource } = require('typeorm');

const myDataSource = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE
});

myDataSource.initialize().then(() => {
    console.log("Data Source has been initialized")
    }).catch(() => {
    console.log("Database initiate fail")
    })

const app = express();
app.use(express.json());
app.use(cors()); // 모든 cors요청 허용

app.post('/users', async (req, res) => {
    const {email, nickname, password, profileImage} = req.body;

    await myDataSource.query(
        `INSERT INTO users (email, nickname, password, profile_image)
        VALUES (?, ?, ?, ?)`
        , [email, nickname, password, profileImage]);
    
    res.status(201).json({"message" : "userCreated"});
});

app.post('/postings', async (req, res) => {
    const {userId, contents} = req.body;
    await myDataSource.query(
        `INSERT INTO postings (user_id, contents)
        VALUES (?, ?)`
        , [userId, contents]);
    res.status(201).json({"message" : "postCreated"});
});

app.get('/postings', async (req, res) => {
    await myDataSource.query(`
        SELECT 
            users.id AS userId, 
            users.profile_image AS userProfileImage,
            postings.id AS postingId, 
            postings.contents AS postingContent 
        FROM postings JOIN users ON postings.user_id=users.id;
        `, (err, rows) => {
            res.status(200).json({data: rows});
        });
});

app.get('/postings/user/1', async (req, res) => {
    const data = await myDataSource.query(`
        SELECT
            users.id as userId,
            users.profile_image as userProfileImage,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'postingId', postings.id,
                    'postingContents', postings.contents
                )
            ) as postings
        FROM postings
        JOIN users ON users.id = postings.user_id
        WHERE users.id = 1
        GROUP BY users.id
        ;`);
    res.status(200).json({data: data});
});

app.patch('/postings/1', async (req, res) => {
    const {contents} = req.body;
    await myDataSource.query(
        `UPDATE postings
        SET contents = ?
        WHERE id = 1;`, [contents]);

    const data = await myDataSource.query(
        `SELECT 
            postings.user_id AS userId,
            users.nickname AS userName,
            postings.id AS postingId,
            postings.contents AS postingContent
        FROM postings
        JOIN users ON users.id = postings.user_id
        WHERE postings.id = 1;
        `);
    res.status(200).json({data: data});
});

app.delete('/postings/6', async (req, res) => {
    await myDataSource.query(
        `DELETE FROM postings
        WHERE id = 6;`);
    res.status(204).json({message: "postingDeleted"});
});

const server = http.createServer(app);
server.listen(8000, () => {console.log("서버켜짐");});