const express = require('express');
const router = express.Router();
const mysql = require('mysql2');


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
});

const promisePool = pool.promise();

module.exports = router;



router.get('/', async function (req, res, next) {
    const [rows] = await promisePool.query("SELECT eho02forum.*, eho02users.name FROM eho02forum JOIN eho02users ON eho02forum.authorId = eho02users.id ORDER BY id DESC LIMIT 5");
    res.render('index.njk', {
        rows: rows,
        title: 'Forum',
        
    });
});


router.get('/login', function (req, res, next) {
    res.render('login.njk', { title: 'Login ALC' });
});


router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;

    if (username.length === 0) {
        res.json('Username is Required')
    }

    else if (password.length === 0) {
        res.json('Password is Required')
    }
    else{
        const [rowsname, query] = await promisePool.query('SELECT name FROM eho02users WHERE name = ?', [username]);
        console.log(rowsname);
        if(rowsname.length > 0 ){
            const [rows, query] = await promisePool.query('SELECT password FROM eho02users WHERE name = ?', [username]);
            SavedID = await promisePool.query('SELECT id FROM eho02users WHERE name  = ? ', [username])
            console.log(SavedID)

            const bcryptPassword = rows[0].password

            bcrypt.compare(password, bcryptPassword , function(err, result) {
                if(result){
                    req.session.loggedin = true;
                    req.session.username = username;
                    req.session.userId = SavedID;

    
                    res.redirect('/forum');
                }else{
                    res.json('Invalid username or password')
                }
          
            });
        }
        else{
            res.json('Invalid username or password')
        }
        
    }
});









































router.post('/new', async function (req, res, next) {
    console.log(req.body)
    const { author, title, content } = req.body;

        // Skapa en ny författare om den inte finns men du behöver kontrollera om användare finns!
        let [user] = await promisePool.query('SELECT * FROM eho02forum WHERE id = ?', [author]);
        if (!user) {
            user = await promisePool.query('INSERT INTO eho02users (name) VALUES (?)', [author]); 
        }
    
        // user.insertId bör innehålla det nya ID:t för författaren
        const userId = user.insertId || user[0].id; 
    
        // kör frågan för att skapa ett nytt inlägg
        const [rows] = await promisePool.query('INSERT INTO eho02forum (authorId, title, content) VALUES (?, ?, ?)', [userId, title, content]); 
       
    res.redirect('/'); 
});

router.get('/new', async function (req, res, next) {
    const [users] = await promisePool.query("SELECT * FROM eho02users");
    res.render('new.njk', {
        title: 'Nytt inlägg',
        users,
    });
});


