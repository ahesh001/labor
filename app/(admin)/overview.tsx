import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OverviewTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Overview</Text>
      <Text style={styles.text}>Live stats, quick links, and a summary will show here.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  title:     { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  text:      { fontSize: 15, color: '#888' }
});
