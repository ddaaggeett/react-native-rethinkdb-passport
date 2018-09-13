import FacebookStrategy from 'passport-facebook'
import GoogleStrategy from 'passport-google-oauth20'
import GitHubStrategy from 'passport-github'
import {
    facebook,
    google,
    github,
    tables,
} from './config'
import {
    passport,
} from './server'
import {
    r,
    dbConnx,
} from './db'

const loginCallbackHandler = function (objectMapper, type) {
    return function (accessToken, refreshToken, profile, done) {
        var newUserInst = objectMapper(profile)
        if (accessToken !== null) {
            r.table(tables.users)
                .getAll(profile.username, { index: 'username' }) // TODO: or 'email' - whichever secondary index is decided to be unique per user
                .filter({ type: type })
                .run(dbConnx)
                .then(function (cursor) {
                    return cursor.toArray()
                        .then(function (users) {
                            if (users.length > 0) { // if user already exists
                                return done(null, users[0])
                            }
                            return r.table(tables.users) // if user doesn't exist yet
                                .insert(newUserInst)
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

// // Transform Facebook profile because Facebook and Google profile objects look different
// // and we want to transform them into user objects that have the same set of attributes
// const transformFacebookProfile = (profile) => ({
//     name: profile.name,
//     username: null,
//     avatar: profile.picture.data.url,
// })
//
// // Transform Google profile into user object
// const transformGoogleProfile = (profile) => ({
//     name: profile.displayName,
//     username: profile.nickname,
//     avatar: profile.image.url,
// })

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
            'username': profile.username,
            'name': profile.displayName || null,
            'url': profile.profileUrl,
            'avatar': profile._json.avatar_url,
            'type': profile.provider
        }
    }, 'github')
))
