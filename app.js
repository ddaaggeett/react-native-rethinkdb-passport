import React, { Component } from 'react'
import {
    Image,
    Linking,
    Platform,
    Text,
    View
} from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import SafariView from 'react-native-safari-view'
import { styles, iconStyles } from './src/styles'

export default class App extends Component {

    constructor() {
        super()
        this.state = {
            user: undefined, // user has not logged in yet
        }
    }

  // Set up Linking
    componentDidMount() {
        // Add event listener to handle OAuthLogin:// URLs
        Linking.addEventListener('url', this.handleOpenURL)
        // Launched from an external URL
        Linking.getInitialURL().then((url) => {
            if (url) {
                this.handleOpenURL({ url })
            }
        })
    }

    componentWillUnmount() {
        // Remove event listener
        Linking.removeEventListener('url', this.handleOpenURL)
    }

    handleOpenURL = ({ url }) => {
        // Extract stringified user string out of the URL
        const [, user_string] = url.match(/user=([^#]+)/)
        this.setState({
            // Decode the user string and parse it into JSON
            user: JSON.parse(decodeURI(user_string))
        }, () => {
            console.log('user is set\n' + JSON.stringify(this.state.user,null,4))
        })
        if (Platform.OS === 'ios') {
            SafariView.dismiss()
        }
    }

    // Handle Login with Facebook button tap
    loginWithFacebook = () => this.openURL('http://localhost:3000/auth/facebook')

    // Handle Login with Google button tap
    loginWithGoogle = () => this.openURL('http://localhost:3000/auth/google')

    // Handle Login with Github button tap
    loginWithGithub = () => this.openURL('http://localhost:3000/auth/github')

    // Open URL in a browser
    openURL = (url) => {
        // Use SafariView on iOS
        if (Platform.OS === 'ios') {
            SafariView.show({
                url: url,
                fromBottom: true,
            })
        }
        // Or Linking.openURL on Android
        else {
            Linking.openURL(url)
        }
    }

    render() {
        const { user } = this.state
        return (
            <View style={styles.container}>
                { user
                  ? // Show user info if already logged in
                    <View style={styles.content}>
                      <Text style={styles.header}>
                        Welcome, {user.name}!{'\n\n'}or should we call{'\n'}you {user.username}?
                      </Text>
                      <View style={styles.avatar}>
                        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                      </View>
                    </View>
                  : // Show Please log in message if not
                    <View style={styles.content}>
                      <Text style={styles.header}>
                        Welcome Stranger!
                      </Text>
                      <View style={styles.avatar}>
                        <Icon name="user-circle" size={100} color="rgba(0,0,0,.09)" />
                      </View>
                      <Text style={styles.text}>
                        Please log in to continue{'\n'}to the awesomness
                      </Text>
                      {/* Login buttons */}
                      <View style={styles.buttons}>
                          {/*}<View
                              style={styles.login_button}
                              ><Icon.Button
                              name="facebook"
                              backgroundColor="#3b5998"
                              onPress={this.loginWithFacebook}
                              {...iconStyles} >
                              Login with Facebook
                          </Icon.Button></View>
                          <View
                              style={styles.login_button}
                              ><Icon.Button
                              name="google"
                              backgroundColor="#DD4B39"
                              onPress={this.loginWithGoogle}
                              {...iconStyles} >
                              Login with Google
                          </Icon.Button></View>*/}
                          <View
                              style={styles.login_button}
                              ><Icon.Button
                              name="github"
                              backgroundColor="gray"
                              onPress={this.loginWithGithub}
                              {...iconStyles} >
                              Login with Github
                          </Icon.Button></View>
                      </View>
                    </View>
                }
            </View>
        )
    }
}
