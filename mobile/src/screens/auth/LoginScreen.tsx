import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { Text, TextInput, Button, IconButton, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#4fc3f7', '#0288d1']}
                style={styles.logoGradient}
              >
                <MaterialCommunityIcons name="shield-check" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text variant="headlineMedium" style={styles.title}>
              CancerGuard AI
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Advanced Healthcare Platform
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email-outline" color={colors.textTertiary} />}
              error={!!errors.email}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-outline" color={colors.textTertiary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  color={colors.textTertiary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors.password}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
            />
            {errors.password && <HelperText type="error">{errors.password}</HelperText>}

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text variant="bodySmall" style={{ color: colors.primary }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              buttonColor={colors.primary}
              textColor="#000"
              labelStyle={{ fontWeight: '700', fontSize: 16 }}
            >
              Sign In
            </Button>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="bodySmall" style={styles.dividerText}>
                or continue with
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social login buttons */}
            <View style={styles.socialRow}>
              <IconButton
                icon="google"
                size={24}
                iconColor={colors.text}
                style={styles.socialBtn}
                onPress={() => Alert.alert('Coming Soon', 'Google sign-in will be available soon.')}
              />
              <IconButton
                icon="apple"
                size={24}
                iconColor={colors.text}
                style={styles.socialBtn}
                onPress={() => Alert.alert('Coming Soon', 'Apple sign-in will be available soon.')}
              />
              <IconButton
                icon="fingerprint"
                size={24}
                iconColor={colors.text}
                style={styles.socialBtn}
                onPress={() => Alert.alert('Coming Soon', 'Biometric login will be available soon.')}
              />
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text variant="bodyMedium" style={styles.secondaryText}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text variant="bodySmall" style={styles.footer}>
            HIPAA Compliant • AES-256 Encrypted • SOC 2 Type II
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  loginButton: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  loginButtonContent: {
    height: 52,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  socialBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    width: 56,
    height: 56,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.textSecondary,
  },
  footer: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
