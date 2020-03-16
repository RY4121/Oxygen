const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const jsdom = require("jsdom");
var JSDOM = jsdom.JSDOM;

//session処理
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000
  }
}));
// フォームから送信された値を受け取れるようにする
app.use(express.urlencoded({
  extended: false
}));
app.use(express.static(__dirname + '/public'));
//定数connectionを定義して接続情報の書かれたコードを代入する
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'rariru',
  password: 'testpass',
  database: 'vote_app'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log('CONNECT OK!!');
});

var flagNum = 0;
var isVoted = false;
app.get('/', (req, res) => {
  // トップ画面を表示
  res.render('top.ejs');
});


app.get('/index', (req, res) => {
  connection.query(
    'select * from items',
    (error, results) => {
      console.log(results);
      res.render('index.ejs', {
        items: results
      });
    });
});

app.get('/login', (req, res) => {
  console.log('get');
  let message = '';
  if (username != '') {
    message = '現在' + username + 'でログインしています';
  } else {
    message = '現在ログインしていません';
  }
  res.render('login.ejs', {
    m: message
  });
});

app.post('/login', (req, res) => {
  connection.query(
    'select * from user where username=(?) and password=(?)', [req.body.userName, req.body.password],
    (error, results) => {
      console.log(results);
      if (results.length == 0) {
        //ログイン失敗
        res.render('login.ejs', {
          m: 'ログインに失敗しました'
        });
      } else {
        username = req.body.userName;
        pass = req.body.password;
        //ログイン成功
        res.redirect('/login');
      }
    });
});

app.get('/create', (req, res) => {
  if (username == '') {
    res.render('create.ejs', {
      m: ''
    });
  } else {
    res.render('create.ejs', {
      m: '現在' + username + 'でログインしています'
    });
  }
});

var username = '';
var pass = '';
app.post('/create', (req, res) => {
  if ((req.body.userName == '') || (req.body.password == '')) {
    res.render('create.ejs', {
      m: '何か値を入力してください'
    });
  } else {
    username = req.body.userName;
    pass = req.body.password;
    req.session.username = username;
    req.session.pass = pass;

    console.log(username, pass);
    connection.query(
      'select * from user where username=(?) and password=(?)', [username, pass],
      (error, results) => {
        console.log(results);
        if (results.length == 0) {
          res.redirect('/createFinished');
        } else {
          res.render('create.ejs', {
            m: '既に登録されたユーザです'
          });
        }

      });
  }
});

app.get('/createFinished', (req, res) => {
  connection.query(
    'insert into user (username,password) values (?,?)', [username, pass],
    (error, results) => {
      res.render('createFinished.ejs');
    });
});

app.get('/vote', (req, res) => {
  connection.query(
    'select * from items',
    (error, results) => {
      console.log(results);
      res.render('vote.ejs', {
        items: results,
        m: ''
      });
    });
});

app.post('/vote', (req, res) => {
  var id = 0;
  if (username == '') {
    connection.query(
      'select * from items',
      (error, results) => {
        console.log(results);
        res.render('vote.ejs', {
          items: results,
          m: '投票するにはログインが必要です'
        });
      });
  } else if (isVoted) {
    connection.query(
      'select * from items',
      (error, results) => {
        console.log(results);
        res.render('vote.ejs', {
          items: results,
          m: '既に投票を終了しています'
        });
      });
  } else {
    connection.query(
      'select id from items where name=(?)', [req.body.itemName],
      (error, results) => {
        id = parseInt(results[0].id);
        flagNum = id;
        res.redirect('/voteFinished');
      });
  }
});

app.get('/voteFinished', (req, res) => {
  connection.query(
    'update items set count=count+1 where id=(?)', [flagNum],
    (error, results) => {
      isVoted = true;
      res.render('voteFinished.ejs');
      console.log('flagNum', flagNum);
    });
});

app.get('/result', (req, res) => {
  connection.query(
    'select * from items order by count desc',
    (error, results) => {
      console.log(results);
      res.render('result.ejs', {
        items: results
      });
    });
});

console.log('PROCESS DONE');
app.listen(3000);
