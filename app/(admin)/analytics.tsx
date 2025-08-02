import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AnalyticsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.text}>Charts and metrics coming soon!</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  title:     { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  text:      { fontSize: 15, color: '#888' }
});
