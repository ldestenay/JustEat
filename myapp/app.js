let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let validator = require('validator');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');

let app = express();

let mysql = require('mysql');
let connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'user_ldestenay',
    password : 'WelComeSQL2021',
    database : 'rich_web_application'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/login', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    connection.query("SELECT * FROM login WHERE username = '" + username + "' AND password = '" + password + "';", function (error, results, fields) {
        if (error) throw error;
        if(results[0] !== undefined)
        {
            console.log(results[0].acctype);
            res.send(results[0].acctype);
        }
        else
        {
            res.sendStatus(403);
        }
    });
});

app.post('/pay', function (req, res){
    let order = req.body.order;
    order = order.split(',');

    for(let i = 0; i < order.length; i++)
    {
        let item = order[i].split('-');
        connection.query("INSERT INTO `order`(order_content, quantity) VALUES ((SELECT id FROM product WHERE pname = \"" + item[0].replace("_qty", "") + "\"), " + item[1] + ");", function (error)
        {
            if(error) {
                console.log(error)
                throw error;
            }
        });
    }

    res.sendStatus(200);
});

app.post('/updateDB', function (req, res){
    let id = req.body.id;
    let quantity = req.body.qty;

    connection.query("UPDATE product SET qty = " + quantity + " WHERE id = " + id, function (error){
        if(error)
        {
            console.log(error);
            throw error;
        }
        res.sendStatus(200);
    });
});

app.post('/register', function (req, res){
    let username = req.body.username;
    let password = req.body.password;

    connection.query("SELECT * FROM login WHERE username = \"" + username + "\" AND password = \"" + password + "\";", function (error, results, fields){
        if(error){
            console.log(error);
            throw error;
        }

        if(results[0] !== undefined) {
            return res.sendStatus(401);
        }

        connection.query("INSERT INTO login(username, password, acctype) VALUES (\"" + username + "\", \"" + password + "\", \"customer\");", function (error){
            if(error){
                console.log(error);
                throw error;
            }
            res.sendStatus(200);
        });
    });
});

app.get('/getAmount', function(req, res){

    let pname = req.query.productName;
    if(pname === undefined) res.sendStatus(404);

    connection.query("SELECT price FROM product WHERE pname = \"" + pname + "\";", function (error, results, fields){
        if(error){
            console.log(error);
            throw error;
        }
        if(results[0].price !== undefined) res.send({price: results[0].price});
    })
})

app.get('/getManagerStats', function (req, res){
    let buffer = '';
    let totalPrice = 0;
    connection.query("SELECT product.pname, product.price, `order`.quantity FROM `order` LEFT JOIN product ON `order`.order_content = product.id ", function (error, results, fields)
    {
        if(error)
        {
            console.log(error);
            throw error;
        }
        results.forEach(element => {
            buffer += '<tr><td>' + element.pname + '</td>';
            buffer += '<td>' + element.quantity + '</td>';
            buffer += '<td>' + element.price * element.quantity + ' euros</td></tr>';
            totalPrice += element.price * element.quantity;
        })

        buffer += '';
        res.send({table: buffer, total: 'For a total of ' + totalPrice + ' euros<br>'});
    })
})

app.get('/getCookData', function (req, res){
   connection.query("SELECT * FROM product;", function(error, results, fields){
        if(error) throw error;
        let buffer = '';
        for(let i = 0; i < results.length; i++)
        {
            buffer += '<div data-role="fieldcontain" class="ui-field-contain">';
            buffer += '<label for="' + results[i].pname + '">' + results[i].pname + '</label>';
            buffer += '<div class="ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset">';
            buffer += '<input type="text" id="' + results[i].id + '" value="' + results[i].qty + '" >';
            buffer += '</div>';
            buffer += '<button class="ui-btn" onclick="updateDB(' + results[i].id + ')">Save</button><br>';
            buffer += '</div>';
        }

        res.send(buffer);
   });
});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;