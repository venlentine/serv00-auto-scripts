const { Client } = require('pg');

const encodedUrl = process.env.POSTGRES_CONNECT_URL;

const pgclient = new Client({
    connectionString:encodedUrl
});

pgclient.connect();
// 连接池初始化完成后执行查询
pgclient.on('connect', () => {
  console.log('Connected to PostgreSQL:' + encodedUrl);
});

const drop = 'DROP TABLE student'
const table = 'CREATE TABLE student(id SERIAL PRIMARY KEY, firstName VARCHAR(40) NOT NULL, lastName VARCHAR(40) NOT NULL, age INT, address VARCHAR(80), email VARCHAR(40), create_time TIMESTAMP)'
const text = 'INSERT INTO student(firstname, lastname, age, address, email, create_time) VALUES($1, $2, $3, $4, $5, NOW()) RETURNING *'
const values = ['Mona the', 'Octocat', 9, '88 Colin P Kelly Jr St, San Francisco, CA 94107, United States', 'octocat@github.com']

pgclient.query(drop, (err, res) => {
    if (err) throw err
});

pgclient.query(table, (err, res) => {
    if (err) throw err
});

pgclient.query(text, values, (err, res) => {
    if (err) throw err
});

pgclient.query('SELECT * FROM student', (err, res) => {
    if (err) throw err
    console.log(err, res.rows) // Print the data in student table
    pgclient.end()
});