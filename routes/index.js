const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const validator = require('validator');

let errors = [];
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
});

const promisePool = pool.promise();

module.exports = router;



router.get('/', async function (req, res, next) {
    const [rows] = await promisePool.query("SELECT eho02forum.*, eho02users.name FROM eho02forum JOIN eho02users ON eho02forum.authorId = eho02users.id ORDER BY id DESC LIMIT 20");
    res.render('index.njk', {
        rows: rows,
        title: 'Forum',
        loggedin: req.session.loggedin,
        
    });
});



router.get('/login', function (req, res, next) {
    res.render('login.njk', { title: 'Login ALC' });
});


router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;
    errors = [];
    if (!username) {
        errors.push('Username is Required')
    }

    if (!password) {
        errors.push('Password is Required')
    }

    if(errors.length === 0){
        const [rowsname, query] = await promisePool.query('SELECT name FROM eho02users WHERE name = ?', [username]);
        console.log(rowsname);
        if(rowsname.length > 0 ){
            const [rows, query] = await promisePool.query('SELECT password FROM eho02users WHERE name = ?', [username]);
            const [SavedID, query2] = await promisePool.query('SELECT id FROM eho02users WHERE name  = ? ', [username])
           
            
            const bcryptPassword = rows[0].password

            bcrypt.compare(password, bcryptPassword , function(err, result) {
                if(result){

                    req.session.loggedin = true;
                    req.session.username = username;
                    req.session.userId = SavedID[0].id;

    
                    res.redirect('/');
                }else{
                    res.render('login.njk', {
                        msg: "Invalid username or password",    
                    })
                }
          
            });
        }
        else{
            res.render('login.njk', {
                msg: "Invalid username or password",    
            })
        }
        
    }
});

router.get('/register', function(req, res, next){
    res.render('register.njk', { title: 'Lägg till användare' });
});

router.post('/register', async function(req, res, next){
    const { username, password, passwordConfirmation, } = req.body;
    errors = [];
    if (!username) {
      errors.push('Username is Required')
    }
//    if(!validator.isAlphanumeric(username [locale, options])){
  //      errors.push('Username can only contain Letters and Numbers ')
   // }

    if (!password) {
       errors.push('Password is Required')
    }

    if (passwordConfirmation !== password){
       errors.push('Passwords do not match')
    } 
    if (username && username.length < 3){    
       errors.push('Username must be at least 3 characters');    
    }

    if (password && password.length < 8){
        errors.push('Password must be at least 8 characters');
    }

    if(errors.length === 0) {
        const [user, query] = await promisePool.query('SELECT name FROM eho02users WHERE name = ?', [username]);
            if(user.length > 0 ){
                errors.push('Username is already taken')
            }
            else{

                bcrypt.hash (password, 10, async function(err, hash){
                    await promisePool.query('INSERT INTO eho02users (name, password) VALUES (?, ?)', [username,hash]);
               
                });       
                res.redirect('/login');         
            }
    }
    if(errors.length !== 0){


        res.render('register.njk', {
            title: 'Register',
            msg: errors,
            
        });
    }
    
    
});





router.get('/logout', async function(req, res, next){
    if(req.session.loggedin){
        console.log("HEj")
        req.session.destroy();
        res.redirect('/login')
    }
    else{
        res.status(418).json('Something went wrong')
    }
});




router.post('/new', async function (req, res, next) {
    console.log(req.body)
    const {title, content } = req.body;
    errors = [];
    if (!title) {
       errors.push('Title is Required')
    }

    if (!content) {
       errors.push('Body is Required')
    }


    if (title && title.length <= 3){    
        errors.push('Title must be at least 3 characters');    
    }

    if (content && content.length <= 10){
        errors.push('Body must be at least 10 characters');
    }

    if(errors.length === 0) {

        const id = req.session.userId;
        const sanitize = (str) =>{
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        }
      

    
        sanitizeTitle = sanitize(title);
 
        sanitizeBody = sanitize(content);
       
        // kör frågan för att skapa ett nytt inlägg
        const [rows] = await promisePool.query('INSERT INTO eho02forum (authorId, title, content) VALUES (?, ?, ?)', [id, sanitizeTitle, sanitizeBody]);      
        res.redirect('/'); 
    }else{
        res.render('new.njk', {
            title: 'Nytt inlägg',
            user: req.session.username,
            msg: errors,
        });
        
    }
});

router.get('/new', async function (req, res, next) {
    if(!req.session.loggedin){
        res.redirect('/login')
    }else{

    res.render('new.njk', {
        title: 'Nytt inlägg',
        user: req.session.username,
    });
    
    }
});

router.get('/profile', async function (req, res, next) {
    if(!req.session.loggedin){
        res.redirect('/login')
    }else{

    res.render('profile.njk', {
        title: 'profile',
    });
    
    }
});




router.post('/delete', async function (req, res, next) {
    if(!req.session.loggedin){
        res.redirect('/login')
    }else{

        await promisePool.query('DELETE FROM eho02users WHERE id  = (?)', [req.session.userId]);     
        res.redirect('/logout')
    }
});