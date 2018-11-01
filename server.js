const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const parser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const {Schema} = mongoose;

const port = process.env.PORT || 8000;
// invoke express and store the result in the variable app
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.set('views', path.join(__dirname, 'views'));

app.use(parser.urlencoded({ extended: true }));
app.use(parser.json());
app.use(flash());

app.use(session({
    secret:'superSekretKitteh',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false, maxAge: 60000}
}));

app.listen(port, () => console.log(`Express server listening on port ${port}`));

let count = 0;
let name = '';
// mongodb connection
mongoose.connect('mongodb://localhost:27017/basic_mongoose', { useNewUrlParser: true });
mongoose.connection.on('connected', () => console.log('MongoDB connected'));

// schema
const UserSchema = new mongoose.Schema({
// const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a name is required'],
        trim: true,
      },
    age: Number
})
mongoose.model('User', UserSchema); // We are setting this Schema in our Models as 'User'
const User = mongoose.model('User', UserSchema) // We are retrieving this Schema from our Models, named 'User'

//routing
    //root route - display all
app.get('/', (request, response) => {
    console.log('getting to index');
    // This is where we will retrieve the users from the database 
    // and include them in the view page we will be rendering.
    User.find({})
        .then((basic_mongoose) => {
            const users = basic_mongoose;
            console.log('successfully retrieved all users');
            console.log(basic_mongoose);
            // response.render('user', {user});
            response.render('index', {users, title: 'Express and Mongoose' })
        })
        // if there is an error console.log that something went wrong!
        .catch(error => {
            console.log('something went wrong');
            for (let key in error.errors) {
                request.flash('get_error', error.errors[key].message)
                console.log(error.errors[key].message);
            }
        });
});

// Add User Request 
// When the user presses the submit button on index.ejs it should send a post request to '/users'.
// In this route we should add the user to the database and then redirect to the root route (index view)

// create new user form
app.post('/user/new', function(request, response) {
    console.log("POST DATA", request.body);
    // This is where we would add the user from req.body to the database.
    // create a new User with the name and age corresponding to those from req.body
    // const user = new User({name: request.body.name, age: request.body.age});

    User.create(request.body)
        .then(user => {
            console.log('created ', user);
            console.log('successfully added a user!');
            response.redirect('/');
        })
        .catch(error => {
            for (let key in error.errors) {
                request.flash('create_error', error.errors[key].message);
            }
            console.log('something went wrong');
            response.redirect('/user/new');
        });
})

app.get('/user/:_id', (request, response) => {
    const which = request.params._id;
    User.find({_id:which})
        .then((basic_mongoose) => {
            console.log(basic_mongoose);
            users = basic_mongoose;
            response.render('view', {user, title: 'View user page'});
        })
        // if there is an error console.log that something went wrong!
        .catch(error => {
            console.log('something went wrong');
            for (let key in error.errors) {
                request.flash('get_error', error.errors[key].message)
                console.log(error.errors[key].message);
            }
            response.redirect('/');
        });
});

app.get('/user/delete/:_id', (request,response) => {
    const which = request.params._id;
    User.remove({_id:which})
        .then(() => {
            console.log('deleted successfully')
            response.redirect('/');
        })
        .catch((error) => console.log(error));
            response.redirect('/');

});

// catch 404 and forward to error handler
app.use((request, response, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, request, response, next) => {
    // set locals, only providing error in development
    response.locals.message = err.message;
    response.locals.error = request.app.get('env') === 'development' ? err : {};
    response.status(err.status || 500);
    // render the error page
    response.render('error', {title: 'Error page'});
  });

// app.listen(port, () => console.log(`Express server listening on port ${port}`));    // ES6 way