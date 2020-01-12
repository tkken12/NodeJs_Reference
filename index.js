var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport');
var app = express();

// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb://localhost:27017/post');
var db = mongoose.connection;
db.once('open', function(){
  console.log('DB connected');
});
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});

// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash());
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true})); //session hash 화

// Passport
app.use(passport.initialize()); //반드시 필요. passport 초기화 함수
app.use(passport.session()); // 반드시 필요. passport와 session을 연결 session은 express-session pack에서 생성, app.use(session({secret:'MySecret', resave:true, saveUninitialized:true}));가 반드시 필요

// Custom Middlewares, 
app.use(function(req,res,next){ //next를 넣어줘야 다음으로 진행, res.locals에 담긴 변수는 ejs에서 바로 사용 가능
  res.locals.isAuthenticated = req.isAuthenticated(); // req.isAuth는 passport 함수로 현재 로그인이 되어있는지 bool로 표현, ejs에서 로그인 되어있는지 확인할 때 사용
  res.locals.currentUser = req.user; // req.user는 로그인이 되면 session으로 부터 user를 deserialize 하여 생성, currentusers는 user의 정보를 불러오는데 사용
  next();
});

// Routes
app.use('/', require('./routes/home'));
app.use('/posts', require('./routes/posts'));
app.use('/users', require('./routes/users'));

// Port setting
var port = 3005;
app.listen(port, function(){
  console.log('server on! http://localhost:'+port);
});
