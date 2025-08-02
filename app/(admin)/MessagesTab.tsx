// app/(admin)/MessagesTab.tsx

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { db } from "../firebaseConfig"; // (TODO: Connect to Firestore for live messages)

export default function MessagesTab() {
  // Simulate messages: replace with live Firestore listener
  const [messages, setMessages] = useState([
    {
      id: "msg1",
      sender: "lead",
      text: "🔒 Encrypted: Delivery #481 has been updated.",
      time: "2 min ago",
      unread: true
    },
    {
      id: "msg2",
      sender: "trucker",
      text: "🔒 Encrypted: ETA for drop-off is 15:30.",
      time: "12 min ago",
      unread: false
    }
  ]);

  // Tap a message to view full decrypted thread (simulate for now)
  const handleMessagePress = (msg: any) => {
    // TODO: Navigate to a chat screen and decrypt
    alert(`DECRYPTED MESSAGE:\n\n${msg.text.replace("🔒 Encrypted: ", "")}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encrypted Messages</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.msgRow, item.unread && styles.msgUnread]}
            onPress={() => handleMessagePress(item)}
          >
            <MaterialCommunityIcons
              name="message-lock-outline"
              size={26}
              color={item.unread ? "#CC5500" : "#888"}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.msgSender, item.unread && { fontWeight: "bold", color: "#CC5500" }]}>
                From {item.sender}
              </Text>
              <Text style={styles.msgText}>{item.text}</Text>
            </View>
            <Text style={styles.msgTime}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", color: "#181818", marginBottom: 12 },
  msgRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fafafa",
    borderRadius: 10, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: "#f0f0f0"
  },
  msgUnread: {
    backgroundColor: "#FFF3E7"
  },
  msgSender: { fontSize: 15, color: "#444" },
  msgText: { color: "#555", fontSize: 15, marginTop: 2 },
  msgTime: { fontSize: 13, color: "#999", marginLeft: 8 }
});
