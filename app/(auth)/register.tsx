// app/(auth)/register.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard
} from "react-native";
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function RegisterScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleRegister = async () => {
  setError(null);

  // 1. Frontend validation
  if (!email || !password || !confirmPassword) {
    setError("All fields are required.");
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    setError("Enter a valid email address.");
    return;
  }
  if (password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }
  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);
  try {
    // 2. Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 3. Create user doc in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      role: "user",
      createdAt: Date.now(),
    });

    setLoading(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    // 4. Route to login with success alert
    Alert.alert(
      "Success",
      "Account created! You can now log in.",
      [{ text: "Go to Login", onPress: () => router.replace("/(auth)/login") }]
    );
  } catch (err: any) {
    setLoading(false);
    // Firebase error: email-already-in-use
    if (err.code === "auth/email-already-in-use") {
      setError("Account already exists. Please log in.");
    } else if (err.code === "auth/invalid-email") {
      setError("Invalid email address.");
    } else if (err.code === "auth/weak-password") {
      setError("Password is too weak (minimum 6 characters).");
    } else {
      setError(err.message || "Registration failed.");
    }
  }
};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Labor Tracker</Text>
          <Text style={styles.subtitle}>Create an Account</Text>
          {error && <Text style={{ color: "red", marginBottom: 12 }}>{error}</Text>}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="email@domain.com"
              placeholderTextColor="#888"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              importantForAutofill="yes"
              textContentType="emailAddress"
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              blurOnSubmit={false}
              importantForAutofill="yes"
              textContentType="newPassword"
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={confirmRef}
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              importantForAutofill="yes"
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.linkText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#181818",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 30,
    color: "#181818",
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e4",
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  input: {
    height: 48,
    fontSize: 16,
    color: "#181818",
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 8,
    width: "100%",
    maxWidth: 340,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  linkText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
  },
});