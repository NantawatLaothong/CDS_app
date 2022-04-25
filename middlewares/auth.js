const User = require('../models/User');

exports.isLoggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // req.flash('error', 'You must be singed in first!')
        return res.redirect('/login');
    }
    // call next if the user is authenticated
    next();
}

// exports.isAuthortized = async (req, res, next) => {
//     const {id} = req.params
//     // find the user that 
//     const user = await User.findById(req.params.id);
//     if(!user.equals(req.user._id)){
//         req.flash('error', "You do not have the permission!")
//         return res.redirect(`/arts`)
//       }
//       next();
// }

// exports.isAuthor = async (req, res, next) => {
//     const {id} = req.params;
//     // find the user that 
//     const art = await Art.findById(id);
//     if(!art.user.equals(req.user._id)){
//         req.flash('error', "You do not have the permission!")
//         return res.redirect(`/arts`)
//       }
//       next();
// }
