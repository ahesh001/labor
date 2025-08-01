// app/(auth)/forgot-password.tsx
import React, { useState, useRef } from 'react';
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
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebaseConfig';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setLoading(false);
      Alert.alert(
        "Password Reset Email Sent",
        "Check your inbox (and spam folder). Follow the link to reset your password.",
        [
          { text: "OK", onPress: () => router.replace("/(auth)/login") }
        ]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Reset Failed", err.message || "Unable to send reset email.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Labor Tracker</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="email@domain.com"
              placeholderTextColor="#888"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handlePasswordReset}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handlePasswordReset} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
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
    flex: 1, backgroundColor: '#fff', padding: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 50, color: '#181818',
  },
  inputContainer: {
    width: '100%', maxWidth: 340,
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#e4e4e4',
    borderRadius: 8, marginBottom: 18, paddingHorizontal: 12,
  },
  input: {
    height: 48, fontSize: 16, color: '#181818',
  },
  button: {
    backgroundColor: '#000', borderRadius: 8, width: '100%', maxWidth: 340,
    height: 48, alignItems: 'center', justifyContent: 'center'
  },
  buttonText: {
    color: '#fff', fontWeight: 'bold', fontSize: 17
  },
  linkText: {
    fontSize: 15, color: '#888', textAlign: 'center'
  }
});