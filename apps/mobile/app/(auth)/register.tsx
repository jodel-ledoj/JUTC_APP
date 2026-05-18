import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'Required';
    if (!form.lastName.trim()) next.lastName = 'Required';
    if (!form.phone.trim()) next.phone = 'Required';
    else if (!/^\+?[0-9]{7,15}$/.test(form.phone.replace(/\s/g, ''))) next.phone = 'Invalid phone number';
    if (form.password.length < 8) next.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      return (await api.post('/auth/register', {
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        phone: form.phone.trim(),
        password: form.password,
        role: 'PASSENGER',
      })).data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.replace('/(passenger)');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Registration failed';
      Alert.alert('Error', msg);
    },
  });

  const handleSubmit = () => {
    if (validate()) registerMutation.mutate();
  };

  const field = (key: keyof typeof form, label: string, opts?: {
    placeholder?: string;
    secure?: boolean;
    keyboardType?: any;
  }) => (
    <View style={styles.fieldGroup} key={key}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, errors[key] ? styles.inputError : null]}
        value={form[key]}
        onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
        placeholder={opts?.placeholder ?? label}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={opts?.secure}
        keyboardType={opts?.keyboardType ?? 'default'}
        autoCapitalize={opts?.secure ? 'none' : 'words'}
      />
      {errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.wordmark}>JUTC</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join JUTC Digital Transit</Text>
      </View>

      {field('firstName', 'First Name', { placeholder: 'John' })}
      {field('lastName', 'Last Name', { placeholder: 'Smith' })}
      {field('phone', 'Phone Number', { placeholder: '+1 876 XXX XXXX', keyboardType: 'phone-pad' })}
      {field('password', 'Password', { placeholder: 'Min. 8 characters', secure: true })}
      {field('confirmPassword', 'Confirm Password', { placeholder: 'Repeat password', secure: true })}

      <TouchableOpacity
        style={[styles.btn, registerMutation.isPending && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Create Account</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkAccent}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 32, marginTop: 8 },
  wordmark: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: 3, marginBottom: 14 },
  title: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: Colors.textMuted, fontSize: 14 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { color: Colors.textMuted, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.critical },
  fieldError: { color: Colors.critical, fontSize: 12, marginTop: 4 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: Colors.textMuted, fontSize: 14 },
  loginLinkAccent: { color: Colors.primary, fontWeight: '600' },
});
