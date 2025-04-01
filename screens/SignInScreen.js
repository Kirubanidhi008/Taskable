import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  GoogleSignin,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";

export default function SignInScreen() {
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigation = useNavigation();

  // Configure Google Sign-In when the component mounts
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "466456422986-fr65gvlu0ohqesc4ubqs70odes9ndqu6.apps.googleusercontent.com",
      scopes: [
        "https://www.googleapis.com/auth/calendar", // Access to Google Calendar
        "https://www.googleapis.com/auth/calendar.events", // Access to modify events
      ],
    });
  }, []);

  // Function to handle Google Sign-In
  const signin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      console.log("User Info:", user);

      // Retrieve authentication tokens
      const tokens = await GoogleSignin.getTokens();
      console.log("Google Calendar Access Token:", tokens.accessToken);

      // Update user info with access token
      const updatedUser = { ...user, accessToken: tokens.accessToken };
      setUserInfo(updatedUser);
      setError(null);

      // Navigate to HomeScreen with user details
      navigation.replace("HomeScreen", { user: updatedUser });
    } catch (e) {
      console.error("Sign-in error:", e);
      setError(e);
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUserInfo(null);
    } catch (e) {
      console.error("Logout error:", e);
      setError(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Taskable</Text>

      <View style={styles.card}>
        <Image source={require("../assets/logo.png")} style={styles.image} />

        {/* Display error message if sign-in fails */}
        {/* {error && <Text style={styles.errorText}>{JSON.stringify(error)}</Text>} */}

        {/* From documentation but will not work in this screen as we will be navigated to homescreen once we signed in successfully */}
        {userInfo ? (
          <>
            {userInfo.user ? (
              <>
                <Text style={styles.welcomeText}>
                  Welcome, {userInfo.user.email}!
                </Text>
              </>
            ) : (
              <Text style={styles.welcomeText}>Loading user info...</Text>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.buttonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            style={styles.signInButton}
            onPress={signin}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D0BFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: "900",
    color: "#5A189A",
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    height: "70%",
    padding: 30,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    alignItems: "center",
    width: "90%",
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  image: {
    width: 140,
    height: 140,
    marginBottom: 50,
    marginTop: 30,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#240046",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
  },
  signInButton: {
    marginBottom: 100,
    marginTop: "auto",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
