// app/(auth)/login.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./context/AuthContext";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setRole } = useAuth();

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      // Fetch role from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        setRole(role); // Set the role in context
        // Navigate based on role
        if (role === "admin") router.replace("/(admin)/dashboard" as any);
        else if (role === "lead") router.replace("/(lead)/dashboard");
        else if (role === "trucker") router.replace("/(trucker)/dashboard" as any);
        else if (role === "customer") router.replace("/(customer)/dashboard");
        else router.replace("/(auth)/unauthorized" as any); // default/fallback
      } else {
        setError("User record not found.");
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(
        err?.message?.includes("user-not-found") ? "No user found." :
        err?.message?.includes("wrong-password") ? "Incorrect password." :
        err?.message || "Login failed."
      );
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              importantForAutofill="yes"
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 24 }}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.linkText}>
              Don’t have an account? <Text style={styles.linkHighlight}>Register</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={[styles.linkText, { color: "#888" }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#fff", padding: 24,
    justifyContent: "center", alignItems: "center",
  },
  title: {
    fontSize: 28, fontWeight: "bold", marginBottom: 40, color: "#181818",
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fafafa", borderWidth: 1,
    borderColor: "#e4e4e4", borderRadius: 8,
    paddingHorizontal: 12, marginBottom: 16, width: "100%", maxWidth: 340,
  },
  input: {
    flex: 1, height: 48, fontSize: 16, color: "#181818",
  },
  button: {
    backgroundColor: "#000", borderRadius: 8, marginTop: 10,
    width: "100%", maxWidth: 340, height: 48, alignItems: "center", justifyContent: "center"
  },
  buttonText: {
    color: "#fff", fontWeight: "bold", fontSize: 17
  },
  linkText: {
    fontSize: 15, color: "#888", textAlign: "center"
  },
  linkHighlight: {
    color: "#000", fontWeight: "600"
  }
});