const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const parser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const {Schema} = mongoose;

const port = process.env.PORT || 9000;
// invoke express and store the result in the variable app
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.set('views', path.join(__dirname, 'views'));

app.use(parser.urlencoded({ extended: true }));
app.use(parser.json());
app.use(flash());  // for flashing error messaging to the user
// app.use(flash());

const sessionConfig = {
    secret: 'superSekretKitteh',
    resave: false,
    name: 'session',
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
};
app.use(session(sessionConfig));

// const server = app.listen(9000);
app.listen(port, () => console.log(`Express server listening on port ${port}`));    // ES6 way


// mongodb connection
mongoose.connect('mongodb://localhost:27017/quoting_dojo', { useNewUrlParser: true });
mongoose.connection.on('connected', () => console.log('MongoDB connected'));

// Create a schema for Users (UserSchema)
const QuoteSchema = new mongoose.Schema({
// const UserSchema = new mongoose.Schema({
    author: { 
        type: String, 
        required: [true, 'A name is required'], 
        minlength: 3, 
        trim: true 
    },
    quote: { 
        type: String, 
        required: [true, 'A quote is required'], 
        maxlength: 30 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
})

mongoose.model('Quote', QuoteSchema); // We are setting this Schema in our Models as 'User'
const Quote = mongoose.model('Quote'); // We are retrieving this Schema from our Models, named 'User'
// module.exports = mongoose.model('User');  // this is an example of how we would call the above line when we modularize

// routing
    // root route - display all
app.get('/', (request, response) => {  
    console.log('getting to index');
    response.render('index', {title: 'Quoting Dojo'})
});

app.get('/quotes', (request, response) => {
    // This is where we will retrieve the users from the database 
    // and include them in the view page we will be rendering.
    Quote.find({})
        .then((quoting_dojo) => {
            const quotes = quoting_dojo;
            console.log('successfully retrieved all quotes in the /quotes route');
            // console.log(quoting_dojo);
            // response.render('user', {user});
            response.render('quotes', {quotes, title: 'All Quotes' })
        })
        // if there is an error console.log that something went wrong!
        .catch(error => {
            console.log(`something went wrong`);
            for (let key in error.errors) {
                request.flash('get_error', error.errors[key].message)
                console.log(error.errors[key].message);
            }
        });
});

// Add New Quote Request 
// When the user presses the submit button on index.ejs it should send a post request to '/quotes'.
// In this route we should add the quote to the database and then redirect to the root route (index view)

app.post('/quotes', (request, response) => {
    console.log("POST DATA", request.body);
    // This is where we would add the user from req.body to the database.
    // create a new Quote with the name and quote corresponding to those from request.body
    Quote.create(request.body)
        .then(quote => {
            console.log(`successfully created a quote! ${quote}`);
            response.redirect('/quotes');
        })
        .catch(error => {
            for (let key in error.errors) {
                request.flash('create_error', error.errors[key].message);
            }
            console.log(`something went wrong in this /quotes route`);
            response.redirect('/');
        });
});

app.get('/quotes/:_id', (request, response) => {
    const which = request.params._id;
    Quote.find({_id:which})
        .then((quoting_dojo) => {
            quotes = quoting_dojo;
            // console.log('quotes: ', quotes);
            response.render('view', {quote, title: 'Quote page'});
            // console.log('passed the response.render');
        })
        // if there is an error console.log that something went wrong!
        .catch(error => {
            console.log('something went wrong in the individual quotes route');
            for (let key in error.errors) {
                request.flash('get_error', error.errors[key].message)
                console.log(error.errors[key].message);
            }
            response.redirect('/quotes');
        });
});

app.get('/quotes/delete/:_id', (request,response) => {
    const which = request.params._id;
    Quote.remove({_id:which})
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