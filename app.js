require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const port = process.env.PORT;
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local');
const multer = require('multer')
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const auth = require('./middlewares/auth')
const uid = require('uid');
var favicon = require('serve-favicon');
// import the models
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const { Passport } = require('passport');

// session 
sessionOptions = {
    resave: false,
    saveUninitialized: false,
    secret:process.env.secret,
}

app.use(session(sessionOptions))
app.use(flash())

app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.resolve(__dirname,'public')));
// app.use(express.static(path.join(__dirname,'public')));
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));
app.engine('ejs', ejsMate);

// database connection
async function connect(){
    mongoose.connect(process.env.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
}

connect().then(res=>console.log('DB connected'))
    .catch(err=>console.log(err));

// pass required stuff
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// store the signedUser 
app.use((req, res, next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.signedUser = req.user;
    next();
})

app.get('/', async(req, res)=>{
    // console.log(uid())
    res.render('index');
})

app.get('/login', async(req, res)=>{
    res.render('login');
})

// get data from /login
app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect:'/login'}), async(req, res)=>{
     req.flash('success', `Welcome ${req.user.fname}!`)
    res.redirect('/');
})

app.get('/logout', async(req, res)=>{
    req.logout();
    // req.flash('success', 'Goodbye!');
    res.redirect('/');
})

app.get('/users/register', async(req, res)=>{
    console.log(req.body);
    res.render('register')
})

app.post('/users', async(req, res)=>{
    try {
        const {email, username, roleCode, fname, lname, password, department} = req.body;
        const user = new User({
            email: email.toLowerCase(),
            username : email.toLowerCase(),
            fname: fname.toLowerCase(),
            lname: lname.toLowerCase(),
            department,
        });
        switch (roleCode) {
            case '3076':
                user.role = 'IT'
                break;
            case '6723':
                user.role = 'supervisor'
                break;
            case '8911':
                user.role = 'employee'
                break;
        }
        // flash
        user.Bio.profileImage.url = 'https://dev-app-clone-994214.s3.amazonaws.com/1646642994810__cat.jpg'
        // console.log(DOB);
        const registeredUser = await User.register(user, password);
        console.log(registeredUser);
        // res.send(registeredUser);c
        await registeredUser.save();
        
        // console.log(user);
        res.redirect('/login');
        // res.send(req.body);
        } catch(e) {
            // if something wrong redirect the user
            // normally we would use flash
            // console.log('an error occured')
            console.log(e);
            req.flash('error', e.message);
            res.redirect('/users/register');
        }
})

app.get('/order', auth.isLoggedin ,async(req, res)=>{
    res.render('order')
})

app.post('/order', auth.isLoggedin, async(req, res)=>{
    // console.log(req.body)
    try {
        const { address, state, city, zip, spec, phone, notes } = req.body;
        const addressString = `${address} ${city}, ${state} ${zip}`;
        // console.log(req.user);
        const user = await User.findOne(req.user);
        const ticket = new Ticket({
            address: addressString,
            phone,
            notes,
            // user: req.user,
            spec,
            id: uid(8)
        });
        ticket.user = user;
        user.tickets.push(ticket);
        // req.user.tickets.push(ticket);
        // console.log(user);
        // const savedUser = await user.save();
        await user.save();
        const saveTicket= await ticket.save();
        // console.log(saveTicket);
        res.redirect('/dashboard');
    } catch(err) {
        console.log(err);
        res.redirect('/')
    }
})

app.get('/tickets/:id', auth.isLoggedin, async(req, res)=>{
    try{
        // get an ID of the ticket
        const {id} = req.params;
        console.log(id)
        if (req.query.completed) {
            const ticket = await Ticket.findOneAndUpdate({_id: id}, {completed: 'Delivered'});
            await ticket.save();
            res.redirect('/dashboard');
        } else {
            const ticket = await Ticket.findOneAndUpdate({_id: id}, {status: 'Approved'});
            // redirect to 
            await ticket.save();
            res.redirect('/dashboard?status=Approved');
        } 
    } catch(err) {
        console.log(err)
        res.redirect('/')
    }
})

app.get('/dashboard', auth.isLoggedin, async(req, res)=>{
    try{
        if(req.user.role == 'supervisor'){
            const status = (req.query.status != undefined) ? req.query.status : 'Pending';
            // console.log(status);
            // res.send('dashboard')
            const tickets = await Ticket.find({'status': status}).populate('user');
            console.log('tickets')
            res.render('dashboard', {user: req.user, tickets, status});
        } else if(req.user.role == 'IT'){
            const status = (req.query.status != undefined) ? req.query.status : 'Approved';
            if(req.query.completed){
                const tickets = await Ticket.find({'completed': 'Delivered'}).populate('user');
                res.render('dashboard', {user: req.user, tickets, status});
            } else {
                const tickets = await Ticket.find({'status': status, 'completed': 'In-Progress'}).populate('user');
                console.log("Doesn't have a completed")
                res.render('dashboard', {user: req.user, tickets, status});
            }
        } else  {
        const user = await User.findOne(req.user).populate('tickets');
        // console.log(user);
        // console.log(user.tickets)
        const tickets = await Ticket.find({user: user}).populate('user');
        res.render('dashboard', {user, tickets});
        // res.redirect('/'`)
    }
    } catch(err){
        console.log(err)
        res.redirect('/')
    }
})

// Handling non matching request
app.use((req, res, next) => {
    res.status(404).render('404')
})

app.listen(port, ()=>{
    console.log(`app is running on port: ${port}`);
})