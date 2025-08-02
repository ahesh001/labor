// app/(admin)/dashboard.tsx

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

import OverviewTab from "./overview";
import AnalyticsTab from "./analytics";
import UsersTab from "./users";
import DeliversTab from "./delivers";
import ReportsTab from "./reports";
import SettingsTab from "./settings";
import MessagesTab from "./MessagesTab"; // This is your encrypted chat screen!

const TABS = [
  { id: "overview", label: "Overview", icon: "home-outline" },
  { id: "analytics", label: "Analytics", icon: "chart-bar" },
  { id: "users", label: "Users", icon: "account-group-outline" },
  { id: "delivers", label: "Delivers", icon: "cube-outline" },
  { id: "reports", label: "Reports", icon: "file-document-outline" },
  { id: "settings", label: "Settings", icon: "cog-outline" }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const currentUserName = "Sarah Johnson"; // Replace with actual user name from context or auth state

  // Simulate new messages
  useEffect(() => {
    // TODO: Replace with Firebase listener for encrypted messages
    setHasNewNotification(true); // For demo, always has notification
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (err) {}
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":   return <OverviewTab />;
      case "analytics":  return <AnalyticsTab />;
      case "users":      return <UsersTab />;
      case "delivers":   return <DeliversTab/>;
      case "reports":    return <ReportsTab />;
      case "messages":   return <MessagesTab />; //Remove this from the tabs
      case "settings":   return <SettingsTab />;
      default:           return <OverviewTab />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Labor Tracker</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Bell for encrypted messages */}
          <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setActiveTab("messages")}
            >
            <MaterialCommunityIcons name="bell-outline" size={26} color="#444" />
                {hasNewNotification && <View style={styles.redDot} />}
            </TouchableOpacity>
          {/* Logout */}
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={26} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

        {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeText}>
            Welcome back, <Text style={{ color: "#CC5500", fontWeight: "bold" }}>{currentUserName}</Text>
            </Text>
        </View>

      {/* Tab Navigation */}
     <View style={styles.tabsContainer}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row" }}>
    {TABS.map(tab => (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabBtn,
          activeTab === tab.id && styles.tabActive
        ]}
        onPress={() => setActiveTab(tab.id)}
      >
        <MaterialCommunityIcons
          name={tab.icon as any}
          size={20}
          color={activeTab === tab.id ? "#CC5500" : "#444"}
        />
        <Text style={[
          styles.tabLabel,
          activeTab === tab.id && { color: "#CC5500" }
        ]}>
          {tab.label}
        </Text>
        </TouchableOpacity>
    ))}
        </ScrollView>
    </View>

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 30, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: "#fff",
    borderBottomWidth: 1, borderColor: "#f0f0f0"
  },
  brand: { fontSize: 22, fontWeight: "bold", color: "#CC5500" },
  iconButton: { marginLeft: 14, padding: 5 },
  redDot: {
    position: "absolute", right: 2, top: 3, width: 10, height: 10,
    borderRadius: 6, backgroundColor: "#d11a1a", borderWidth: 1, borderColor: "#fff"
  },
  welcomeBanner: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFF3E7" },
    welcomeText: { fontSize: 17, color: "#333" },
  tabs: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff",
    paddingVertical: 8, paddingHorizontal: 3, borderBottomWidth: 1, borderColor: "#eee"
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: "#FFF3E7"
  },
  tabLabel: {
    marginLeft: 7, fontSize: 15, fontWeight: "500", color: "#444"
  },
  tabsContainer: {
  backgroundColor: "#fff",
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderColor: "#eee"
},

});
