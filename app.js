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

// specs 
const spec1 = {
    cpu: "Intel Core i5-10400 2.9 GHz 6-Core Processor",
    motherboard: "Asus PRIME B560M-A Micro ATX LGA1200 Motherboard",
    memory: "Team T-FORCE VULCAN Z 16 GB (2 x 8 GB) DDR4-3000 CL16 Memory",
    storage: "Team GX2 512 GB 2.5\" Solid State Drive",
    case: "Thermaltake Versa H17 MicroATX Mini Tower Case",
    powerSupply: "EVGA BR 450 W 80+ Bronze Certified ATX Power Supply",
    os: "Microsoft Windows 10 Home OEM 64-bit",
    cost: "≈561",
    link: "https://pcpartpicker.com/list/LVnt8r"
}

const spec2 = {
  cpu: "AMD Ryzen 9 3900X 3.8 GHz 12-Core Processor",
  motherboard: "Asus ROG STRIX B550-F GAMING (WI-FI) ATX AM4 Motherboard",
  memory: "G.Skill Trident Z RGB 32 GB (4 x 8 GB) DDR4-3000 CL16 Memory",
  storage: "Seagate FireCuda 1 TB 3.5\" 7200RPM Hybrid Internal Hard Drive and ADATA SU800 512 GB 2.5\" Solid State Drive",
  case: "NZXT H440 ATX Mid Tower Case",
  gpu: "EVGA GeForce GTX 1070 8 GB ACX 3.0 Video Card",
  powerSupply: "Corsair CV 650 W 80+ Bronze Certified ATX Power Supply",
  os: "Microsoft Windows 11 Pro OEM 64-bit",
  cost: "≈1707",
  link: "https://pcpartpicker.com/list/yprLJM"
}

const spec3 = {
  cpu: "Intel Core i9-10900K 3.7 GHz 10-Core Processor",
  cooler: "Scythe FUMA 2 51.17 CFM CPU Cooler",
  motherboard: "Asus ROG STRIX Z490-I GAMING Mini ITX LGA1200 Motherboard",
  memory: "Corsair Vengeance RGB Pro 16 GB (2 x 8 GB) DDR4-3200 CL16 Memory",
  storage: "Western Digital Blue Mobile 2 TB 2.5\" 5400RPM Internal Hard Drive and Samsung 970 Evo Plus 1 TB M.2-2280 NVME Solid State Drive",
  case: "Cooler Master MasterBox NR200 Mini ITX Desktop Case",
  gpu: "Asus GeForce GTX 980 Ti 6 GB STRIX Video Card",
  powerSupply: "EVGA SuperNOVA GM 650 W 80+ Gold Certified Fully Modular SFX Power Supply",
  os: "Microsoft Windows 11 Pro OEM 64-bit",
  cost: "≈2050",
  link: "https://pcpartpicker.com/list/WNfzt8"
}

const spec4 = {
  cpu: "Intel Core i7-10700K 3.8 GHz 8-Core Processor",
  cooler: "Noctua NH-D15S chromax.black 82.51 CFM CPU Cooler",
  motherboard: "ASRock Z590M Pro4 Micro ATX LGA1200 Motherboard",
  memory: "Corsair Vengeance LPX 64 GB (2 x 32 GB) DDR4-3200 CL16 Memory",
  storage: "Samsung 970 Evo Plus 500 GB M.2-2280 NVME Solid State Drive",
  case: "Cooler Master N200 MicroATX Mini Tower Case",
  gpu: "PNY Quadro RTX 4000 8 GB Video Card",
  powerSupply: "SeaSonic FOCUS Plus Gold 650 W 80+ Gold Certified Fully Modular ATX Power Supply",
  os: "Microsoft Windows 10 Pro OEM 64-bit",
  cost: "≈2200",
  link: "hhttps://pcpartpicker.com/list/QzzrdD"
}

const specs = [spec1, spec2, spec3, spec4]

// session 
sessionOptions = {
    resave: false,
    saveUninitialized: false,
    secret:process.env.secret,
}

app.use(favicon(path.join(__dirname, 'public', 'logo.png')))

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

// const mongoURI = process.env.mongoURI.toString()
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
    try {
        req.flash('success', `Welcome ${req.user.fname}!`)
        res.redirect('/');
    } catch(e) {
        console.log(e);
        req.flash('error', 'Incorrect password or username');
        res.redirect('/login');
    }
})

app.get('/logout', async(req, res)=>{
    req.logout();
    req.flash('error', 'Logged out')
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
            default:
                user.role = 'employee'
            ;;
        }
        // flash
        user.Bio.profileImage.url = 'https://dev-app-clone-994214.s3.amazonaws.com/1646642994810__cat.jpg'
        // console.log(DOB);
        const registeredUser = await User.register(user, password);
        console.log(registeredUser);
        // res.send(registeredUser);c
        await registeredUser.save();
        req.flash('success', 'User is created successfully!');
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
        req.flash('success', `Ticket is created successfully`)
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
            req.flash('success', "The ticket has been approved");
            res.redirect('/dashboard?status=Approved');
        } 
    } catch(err) {
        console.log(err)
        res.redirect('/')
    }
})

// deny  
app.get('/tickets/:id/deny', auth.isLoggedin, async(req, res)=>{
    try{
        // get an ID of the ticket
        const {id} = req.params;
        console.log(id)
        if (req.query.completed) {
            const ticket = await Ticket.findOneAndUpdate({_id: id}, {completed: 'Delivered'});
            await ticket.save();
            res.redirect('/dashboard');
        } else {
            const ticket = await Ticket.findOneAndUpdate({_id: id}, {status: 'Denied', completed: 'Denied'});
            // redirect to 
            await ticket.save();
            req.flash('success', "The ticket has been denied");
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
            res.render('dashboard', {user: req.user, tickets, status, specs });
        } else if(req.user.role == 'IT'){
            const status = (req.query.status != undefined) ? req.query.status : 'Approved';
            if(req.query.completed){
                const tickets = await Ticket.find({'completed': 'Delivered'}).populate('user');
                res.render('dashboard', {user: req.user, tickets, status, specs});
            } else {
                const tickets = await Ticket.find({'status': status, 'completed': 'In-Progress'}).populate('user');
                console.log("Doesn't have a completed")
                res.render('dashboard', {user: req.user, tickets, status, specs});
            }
        } else  {
        const user = await User.findOne(req.user).populate('tickets');
        // console.log(user);
        // console.log(user.tickets)
        const tickets = await Ticket.find({user: user}).populate('user');
        res.render('dashboard', {user, tickets, specs});
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