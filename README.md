# Logging Into React Native Apps with Facebook/Google/GitHub and storing user sessions in RethinkDB

Learn how to log users into React Native apps via Facebook/Google/GitHub OAuth.

make sure to **activate port forwarding** in your browser: ie - `chrome://inspect/#devices`

    rethinkdb

    npm run server

    npm run android
    or
    npm run ios

#### thanks to:

[Konstantin Shkut](https://github.com/KonstantinShkut) for [demonstrating](https://github.com/rationalappdev/react-native-oauth-login-tutorial) how passport.js works with react native
[Jorge Silva](https://github.com/thejsj) for [demonstrating](https://github.com/thejsj/passport-rethinkdb-tutorial) how passport.js works with rethinkDB

## original tutorial

Read the full tutorial [here](http://rationalappdev.com/logging-into-react-native-apps-with-facebook-or-google)

in this repository, i decided to split up the workflow into a few separate files instead of a single `./backend/server.js` file

## Demo

<img src="https://github.com/rationalappdev/oauth-login/blob/master/demo.gif" alt="Demo" width="640" />
