import express from 'express'
import passport from 'passport'
import FacebookStrategy from 'passport-facebook'
import GoogleStrategy from 'passport-google-oauth20'
// Import Facebook and Google OAuth apps configs
import { facebook, google } from './config'

// Transform Facebook profile because Facebook and Google profile objects look different
// and we want to transform them into user objects that have the same set of attributes
const transformFacebookProfile = (profile) => ({
    name: profile.name,
    screenName: null,
    avatar: profile.picture.data.url,
})

// Transform Google profile into user object
const transformGoogleProfile = (profile) => ({
    name: profile.displayName,
    screenName: profile.nickname,
    avatar: profile.image.url,
})

// Register Facebook Passport strategy
passport.use(new FacebookStrategy(
    facebook,
    function(accessToken, refreshToken, profile, done) { // Gets called when user authorizes access to their profile
        return done(null, transformFacebookProfile(profile._json)) // Return done callback and pass transformed user object
    }
))

// Register Google Passport strategy
passport.use(new GoogleStrategy(
    google,
    function(accessToken, refreshToken, profile, done) {
        return done(null, transformGoogleProfile(profile._json))
    }
))

// Serialize user into the sessions
passport.serializeUser((user, done) => {
    console.log('\nSERIALIZE USER:\n' + JSON.stringify(user,null,2))
    return done(null, user)
})

// Deserialize user from the sessions
passport.deserializeUser((user, done) => {
    console.log('\nDESERIALIZE USER:\n' + JSON.stringify(user,null,2))
    return done(null, user)
})

// Initialize http server
const app = express()

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// Set up Facebook auth routes
app.get('/auth/facebook', passport.authenticate('facebook'))

app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
    (req, res) => { // Redirect user back to the mobile app using Linking with a custom protocol OAuthLogin
        res.redirect('OAuthLogin://login?user=' + JSON.stringify(req.user))
    }
)

// Set up Google auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google' }),
    (req, res) => {
        res.redirect('OAuthLogin://login?user=' + JSON.stringify(req.user))
    }
)

// Launch the server on the port 3000
const server = app.listen(3000, () => {
    const { address, port } = server.address()
    console.log(`Listening at http://${address}:${port}`)
})
