import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Feather name="alert-circle" color="#999" size={64} />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.description}>This screen doesn&apos;t exist.</Text>

        <Link href="/(tabs)/home" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#999",
    marginBottom: 32,
  },
  link: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
