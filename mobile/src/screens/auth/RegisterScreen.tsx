import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Text, TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';

export default function RegisterScreen({ navigation }: any) {
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Min 8 characters required';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({ email, password, full_name: fullName, role, phone });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
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
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="account-plus" size={48} color={colors.primary} />
            <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Join CancerGuard AI Healthcare Platform
            </Text>
          </View>

          {/* Role Selection */}
          <Text variant="labelLarge" style={[styles.whiteText, { marginBottom: 8 }]}>
            I am a...
          </Text>
          <SegmentedButtons
            value={role}
            onValueChange={setRole}
            buttons={[
              { value: 'patient', label: 'Patient', icon: 'account' },
              { value: 'doctor', label: 'Doctor', icon: 'stethoscope' },
              { value: 'hospital_admin', label: 'Hospital', icon: 'hospital-building' },
            ]}
            style={styles.roleSelector}
            theme={{
              colors: {
                secondaryContainer: `${colors.primary}30`,
                onSecondaryContainer: colors.primary,
                onSurface: colors.textSecondary,
                outline: colors.border,
              },
            }}
          />

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" color={colors.textTertiary} />}
              error={!!errors.fullName}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
            />
            {errors.fullName && <HelperText type="error">{errors.fullName}</HelperText>}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
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
              label="Phone (Optional)"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone-outline" color={colors.textTertiary} />}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
            />

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

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-check-outline" color={colors.textTertiary} />}
              error={!!errors.confirmPassword}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              theme={{ colors: { onSurfaceVariant: colors.textSecondary } }}
            />
            {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              buttonColor={colors.primary}
              textColor="#000"
              labelStyle={{ fontWeight: '700', fontSize: 16 }}
            >
              Create Account
            </Button>

            <View style={styles.loginRow}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  title: { color: colors.text, fontWeight: '700', marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  whiteText: { color: colors.text },
  roleSelector: { marginBottom: spacing.md },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  input: { marginBottom: spacing.sm, backgroundColor: colors.surface },
  registerButton: { borderRadius: borderRadius.md, marginTop: spacing.sm, marginBottom: spacing.md },
  registerButtonContent: { height: 52 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
