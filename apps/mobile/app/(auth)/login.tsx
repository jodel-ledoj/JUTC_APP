import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Colors } from '../../constants/colors';

const loginSchema = z.object({
  phone: z.string().min(7, 'Enter your phone number'),
  password: z.string().min(6, 'Enter your password'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const normalizePhone = (phone: string): string => {
    // Strip spaces, dashes, parentheses
    let p = phone.replace(/[\s\-().]/g, '');
    // If starts with 1876... add +
    if (p.startsWith('1876') || p.startsWith('1876')) p = '+' + p;
    // If starts with 876 (local Jamaica), add +1
    else if (p.startsWith('876')) p = '+1' + p;
    // If no + prefix, add it
    else if (!p.startsWith('+')) p = '+' + p;
    return p;
  };

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await api.post('/auth/login', {
        ...data,
        phone: normalizePhone(data.phone),
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      const isDriver = data.user.role === 'DRIVER' || data.user.role === 'CONDUCTOR';
      router.replace(isDriver ? '/(driver)' : '/(passenger)');
    },
    onError: () => Alert.alert('Sign In Failed', 'Invalid phone number or password.'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>JUTC</Text>
        <Text style={styles.subtitle}>Digital Transit System</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="876 555 0001"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            )}
          />
          <Text style={styles.fieldHint}>Jamaica number e.g. 8765550020</Text>
          {errors.phone && <Text style={styles.fieldError}>{errors.phone.message}</Text>}
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
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}
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

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
          <Text style={styles.registerLink}>
            New to JUTC? <Text style={styles.registerLinkAccent}>Create account</Text>
          </Text>
        </TouchableOpacity>
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
    marginBottom: 52,
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
