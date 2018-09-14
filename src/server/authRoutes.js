import {
    app,
    passport,
} from '.'

// Set up Facebook auth routes
app.get('/auth/facebook', passport.authenticate('facebook'))
app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
    (req, res) => { // Redirect user back to the mobile app using Linking with a custom protocol OAuth
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

// Set up Github auth routes
app.get('/auth/github', passport.authenticate('github'))
app.get(
    '/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth/github' }),
    (req, res) => {
        res.redirect('OAuthLogin://login?user=' + JSON.stringify(req.user))
    }
)
