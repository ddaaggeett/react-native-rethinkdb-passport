import express from 'express'
import passport from 'passport'
import FacebookStrategy from 'passport-facebook'
import GoogleStrategy from 'passport-google-oauth20'
import GitHubStrategy from 'passport-github'
// Import Facebook and Google OAuth apps configs
import { facebook, google, github } from './config'

// var actions = require('../actions')
// var changefeeds = require('./changefeeds')
var r = require('rethinkdb')

var db_host = '127.0.0.1'
var socket_port = 3456
var db_port = 28015
var db = 'rnAuthTest'
var tables = {
    "users": "users"
}
var dbConnx = null

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

const loginCallbackHandler = function (objectMapper, type) {
    return function (accessToken, refreshToken, profile, done) {
        console.log('\nPROFILE\n' + JSON.stringify(profile,null,2))
        var newUserInst = objectMapper(profile)
        console.log('\nNEWUSERINSTANCE\n' + JSON.stringify(newUserInst,null,2))
        if (accessToken !== null) {
            r.table(tables.users)
                .getAll(profile.username, { index: 'screenName' })
                .filter({ type: type })
                .run(dbConnx)
                .then(function (cursor) {
                    return cursor.toArray()
                        .then(function (users) {
                            if (users.length > 0) {
                                return done(null, users[0])
                            }
                            return r.table(tables.users)
                                .insert(objectMapper(profile))
                                .run(dbConnx)
                                .then(function (response) {
                                    return r.table(tables.users)
                                        .get(response.generated_keys[0])
                                        .run(dbConnx)
                                })
                                .then(function (newUser) {
                                    done(null, newUser)
                                })
                        })
                })
                .catch(function (err) {
                    console.log('Error Getting User', err)
                })
        }
    }
}

// // Register Facebook Passport strategy
// passport.use(new FacebookStrategy(
//     facebook,
//     function(accessToken, refreshToken, profile, done) { // Gets called when user authorizes access to their profile
//         return done(null, transformFacebookProfile(profile._json)) // Return done callback and pass transformed user object
//     }
// ))
//
// // Register Google Passport strategy
// passport.use(new GoogleStrategy(
//     google,
//     // function(accessToken, refreshToken, profile, done) {
//     //     return done(null, transformGoogleProfile(profile._json))
//     // }
//     loginCallbackHandler(function (profile) {
//         console.log('\nprofile!!\n' + profile)
//         return {
//             'login': profile._json.nickname,
//             'name': profile.displayName || null,
//             'avatarUrl': profile._json.avatar_url,
//             'type': profile.provider
//         }
//     }, 'google')
// ))

// Github
passport.use(new GitHubStrategy(
    github,
    loginCallbackHandler(function (profile) {
        return {
            'screenName': profile.username,
            'name': profile.displayName || null,
            'url': profile.profileUrl,
            'avatar': profile._json.avatar_url,
            'type': profile.provider
        }
    }, 'github')
))

// Serialize user into the sessions
passport.serializeUser((user, done) => {
    console.log('\nSERIALIZE USER:\n' + JSON.stringify(user,null,2))
    return done(null, user.id)
})

// Deserialize user from the sessions
passport.deserializeUser((id, done) => {
    console.log('\nDESERIALIZE USER:\n' + JSON.stringify(id,null,2))

    r.table(tables.users)
        .get(id)
        .run(dbConnx)
        .then((user) => {
            return done(null, user)
        })
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

// Launch the server on the port 3000
const server = app.listen(3000, () => {
    const { address, port } = server.address()
    console.log(`Listening at http://${address}:${port}`)
})

var io = require('socket.io')(server, {pingTimeout: 1})

r.connect({
    host: db_host,
    port: db_port,
    db: db
}, function (err, connection) {
    r.dbCreate(db).run(connection, function(err, result) {
        if(err) console.log("[DEBUG] RethinkDB database '%s' already exists (%s:%s)\n%s", db, err.name, err.msg, err.message)
        else console.log("[INFO ] RethinkDB database '%s' created", db)
        for(var tbl in tables) {
            (function (tableName) {
                r.db(db).tableCreate(tableName).run(connection, function(err, result) {
                    if(err) console.log("[DEBUG] RethinkDB table '%s' already exists (%s:%s)\n%s", tableName, err.name, err.msg, err.message)
                    else console.log("[INFO ] RethinkDB table '%s' created", tableName)
                    if(tableName === tables.users) {
                        r.table(tables.users).indexCreate('screenName').run(connection, () => console.log('secondary index \'screenName\' set on users table'))
                    }
                })
            })(tbl)
        }
    })
}).then(function(connection) {

    dbConnx = connection

	io.sockets.on('connection', function (socket) {



        // // TODO: pull specific user data upon user name entry. currently overwrites any user name with current user data loaded in redux.
        // socket.on(actions.UPDATE_USER_INST, function(newUserInst) {
        //     try {
        //         r.table(tables.users).get(newUserInst.id).update(newUserInst).run(connection)
        //             .then(data => { // TODO: handle all data.{deleted,errors,inserted,replaced,skipped,unchanged}
        //                 console.log(JSON.stringify(data,null,4))
        //                 if(data.inserted == 1) console.log(newUserInst.id + ' inserted')
        //                 else throw "user not available to update -> will insert user instead"
        //             })
        //             .catch(err => {
        //                 console.log(err)
        //                 console.log("inserting new user object: " + newUserInst.id)
        //                 r.table(tables.users).insert(newUserInst).run(connection)
        //             }
        //         )
        //     }
        //     catch(err) { // never runs because using promise catch above
        //         r.table(tables.users).insert(newUserInst).run(connection)
        //     }
        // })
        //
        // /*
        // RethinkDB changefeed
        // */
        // r.table(tables.users).changes({ includeInitial: true, squash: true }).run(connection).then(changefeeds.changefeeds(socket))
	})
})
.error(function(error) {
	console.log('Error connecting to RethinkDB!\n',error)
})
