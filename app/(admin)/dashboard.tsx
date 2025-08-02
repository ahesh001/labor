import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from '../(auth)/context/AuthContext';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Feather";

type TabKey = "overview" | "analytics" | "users" | "projects" | "reports" | "settings";

const navItems: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview",  label: "Overview",  icon: "home" },
  { key: "analytics", label: "Analytics", icon: "bar-chart-2" },
  { key: "users",     label: "Users",     icon: "users" },
  { key: "projects",  label: "Projects",  icon: "package" },
  { key: "reports",   label: "Reports",   icon: "file-text" },
  { key: "settings",  label: "Settings",  icon: "settings" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // You can use context for user if you want.
  const { user, role, loading } = useAuth();
  useEffect(() => {
    // If not loading and not admin, redirect
    if (!loading && role !== "admin") {
      router.replace("/(auth)/login");
    }
  }, [loading, role]);

  if (loading || role !== "admin") {
    return null; // Or show loading spinner
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case "overview":  return <OverviewContent />;
      case "analytics": return <AnalyticsContent />;
      case "users":     return <UsersContent />;
      case "projects":  return <ProjectsContent />;
      case "reports":   return <ReportsContent />;
      case "settings":  return <SettingsContent />;
      default:          return <OverviewContent />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Labor Tracker</Text>
        <Text style={styles.headerRole}>Admin Dashboard</Text>
      </View>

      {/* Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navBar}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navButton,
              activeTab === item.key && styles.navButtonActive,
            ]}
            onPress={() => setActiveTab(item.key)}
          >
            <Icon
              name={item.icon}
              size={20}
              color={activeTab === item.key ? "#CC5500" : "#888"}
              style={{ marginBottom: 2 }}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === item.key && { color: "#CC5500", fontWeight: "bold" },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

// --- Dashboard Content Components ---

function OverviewContent() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Welcome, Admin!</Text>
      <Text style={styles.sectionDesc}>This is your dashboard overview.</Text>
      {/* ... put stat cards here ... */}
    </View>
  );
}
function AnalyticsContent() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Analytics</Text>
      <Text style={styles.sectionDesc}>Charts and insights go here.</Text>
    </View>
  );
}
function UsersContent() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>User Management</Text>
      <Text style={styles.sectionDesc}>Invite, remove, and manage users.</Text>
    </View>
  );
}
function ProjectsContent() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Projects</Text>
      <Text style={styles.sectionDesc}>Manage all projects and status.</Text>
    </View>
  );
}
function ReportsContent() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reports</Text>
      <Text style={styles.sectionDesc}>View, export, and filter reports.</Text>
    </View>
  );
}
function SettingsContent() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      <Text style={styles.sectionDesc}>System & account settings.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 18, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#CC5500" },
  headerRole: { fontSize: 14, color: "#888" },
  navBar: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", flexGrow: 0 },
  navButton: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 18 },
  navButtonActive: { borderBottomWidth: 2, borderBottomColor: "#CC5500" },
  navLabel: { fontSize: 13, color: "#888" },
  content: { flex: 1, padding: 20 },
  section: { paddingVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 7, color: "#181818" },
  sectionDesc: { color: "#666", fontSize: 14 },
});