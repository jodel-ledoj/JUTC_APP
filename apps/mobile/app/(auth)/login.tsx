import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Colors } from '../../constants/colors';

type LoginMode = 'passenger' | 'driver';

const passengerSchema = z.object({
  identifier: z.string().min(7, 'Enter your phone number'),
  password: z.string().min(6, 'Enter your password'),
});

const driverSchema = z.object({
  identifier: z.string().min(3, 'Enter your Driver ID'),
  password: z.string().min(6, 'Enter your password'),
});

type LoginForm = z.infer<typeof passengerSchema>;

const normalizePhone = (phone: string): string => {
  let p = phone.replace(/[\s\-().]/g, '');
  if (p.startsWith('1876')) p = '+' + p;
  else if (p.startsWith('876')) p = '+1' + p;
  else if (!p.startsWith('+')) p = '+' + p;
  return p;
};

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<LoginMode>('passenger');

  const { control, handleSubmit, formState: { errors }, reset } = useForm<LoginForm>({
    resolver: zodResolver(mode === 'driver' ? driverSchema : passengerSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const switchMode = (next: LoginMode) => {
    setMode(next);
    reset({ identifier: '', password: '' });
  };

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      if (mode === 'driver') {
        const res = await api.post('/auth/driver-login', {
          driverId: data.identifier.trim(),
          password: data.password,
        });
        return res.data.data;
      }
      const res = await api.post('/auth/login', {
        phone: normalizePhone(data.identifier),
        password: data.password,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      const isDriver = data.user.role === 'DRIVER' || data.user.role === 'CONDUCTOR';
      router.replace(isDriver ? '/(driver)' : '/(passenger)');
    },
    onError: () => {
      const label = mode === 'driver' ? 'Driver ID' : 'phone number';
      Alert.alert('Sign In Failed', `Invalid ${label} or password.`);
    },
  });

  const isDriver = mode === 'driver';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>JUTC</Text>
        <Text style={styles.subtitle}>Digital Transit System</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeTab, !isDriver && styles.modeTabActive]}
          onPress={() => switchMode('passenger')}
          activeOpacity={0.7}
        >
          <Text style={[styles.modeTabText, !isDriver && styles.modeTabTextActive]}>
            Passenger
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, isDriver && styles.modeTabActive]}
          onPress={() => switchMode('driver')}
          activeOpacity={0.7}
        >
          <Text style={[styles.modeTabText, isDriver && styles.modeTabTextActive]}>
            Driver / Conductor
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {isDriver ? 'Driver ID' : 'Phone Number'}
          </Text>
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.identifier && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder={isDriver ? 'e.g. DRV-00142' : '876 555 0001'}
                placeholderTextColor={Colors.textMuted}
                keyboardType={isDriver ? 'default' : 'phone-pad'}
                autoCapitalize={isDriver ? 'characters' : 'none'}
                autoComplete={isDriver ? 'off' : 'tel'}
              />
            )}
          />
          {!isDriver && (
            <Text style={styles.fieldHint}>Jamaica number e.g. 8765550020</Text>
          )}
          {errors.identifier && (
            <Text style={styles.fieldError}>{errors.identifier.message}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text style={styles.fieldError}>{errors.password.message}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, mutation.isPending && styles.buttonDisabled]}
          onPress={handleSubmit((data) => mutation.mutate(data))}
          disabled={mutation.isPending}
          activeOpacity={0.85}
        >
          {mutation.isPending
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>

        {!isDriver && (
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
            <Text style={styles.registerLink}>
              New to JUTC?{' '}
              <Text style={styles.registerLinkAccent}>Create account</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  // Form
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 52,
  },
  inputError: {
    borderColor: Colors.critical,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  fieldError: {
    color: Colors.critical,
    fontSize: 12,
    marginTop: 6,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  registerLink: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 28,
    fontSize: 14,
  },
  registerLinkAccent: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
