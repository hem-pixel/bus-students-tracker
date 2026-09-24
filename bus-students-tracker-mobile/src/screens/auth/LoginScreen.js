// FILE: src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { promptBiometricAuth } from '../../services/biometricService';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('parent@vsb.ac.in');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('PARENT');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (roleOverride) => {
    const role = roleOverride || selectedRole;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      dispatch(
        setCredentials({
          token: 'mock_jwt_mobile_session_token_' + Date.now(),
          user: {
            id: role === 'PARENT' ? 'P-101' : role === 'DRIVER' ? 'D-404' : 'A-901',
            name:
              role === 'PARENT'
                ? 'Mr. David Jenkins'
                : role === 'DRIVER'
                ? 'Mr. R. Murugan'
                : 'Campus Transport Controller',
            email,
            role,
            studentName: role === 'PARENT' ? 'Sarah Jenkins' : null,
          },
        })
      );
    }, 600);
  };

  const handleBiometricLogin = async () => {
    const success = await promptBiometricAuth('Scan Face ID / Fingerprint to log into VSB Bus Tracker');
    if (success) {
      handleLogin('PARENT');
    } else {
      Alert.alert('Authentication Failed', 'Biometrics cancelled or mismatch.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🚌</Text>
          </View>
          <Text style={styles.title}>VSB BUS TRACKER</Text>
          <Text style={styles.subtitle}>Institutional Mobile Transit Portal</Text>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleContainer}>
          {['PARENT', 'DRIVER', 'ADMIN'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleTab, selectedRole === r && styles.roleTabActive]}
              onPress={() => setSelectedRole(r)}
            >
              <Text
                style={[
                  styles.roleTabText,
                  selectedRole === r && styles.roleTabTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Institutional Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.dark.textMuted}
            placeholder="name@vsb.ac.in"
          />

          <Text style={styles.label}>Security Passcode</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.dark.textMuted}
            placeholder="••••••••"
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => handleLogin()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#05070A" />
            ) : (
              <Text style={styles.loginButtonText}>CONTINUE TO APP</Text>
            )}
          </TouchableOpacity>

          {/* Quick Biometrics Button */}
          <TouchableOpacity
            style={styles.bioButton}
            onPress={handleBiometricLogin}
          >
            <Text style={styles.bioIcon}>⚡</Text>
            <Text style={styles.bioButtonText}>Instant Biometric Login</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Phase 13 Native Mobile Client • VSB Engineering College</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark.text,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: colors.dark.card,
    borderColor: colors.dark.primary,
    borderWidth: 1,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  roleTabTextActive: {
    color: colors.dark.primary,
  },
  form: {
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.dark.card,
    borderColor: colors.dark.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.dark.text,
    fontSize: 15,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonText: {
    color: '#05070A',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 12,
    backgroundColor: colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  bioIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  bioButtonText: {
    color: colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.dark.textMuted,
  },
});
