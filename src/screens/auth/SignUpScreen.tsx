import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View>
            <Text style={styles.tag}>Welcome to MoveKind</Text>
            <Text style={styles.title} accessibilityRole="header">Let’s begin{'\n'}gently</Text>
          </View>

          <View style={{ gap: 12, marginTop: 24 }}>
            <View>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                accessibilityLabel="Your name"
                placeholder="What should we call you?"
                placeholderTextColor={colors.hint}
                style={styles.input}
              />
            </View>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                accessibilityLabel="Email"
                placeholder="you@example.com"
                placeholderTextColor={colors.hint}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                accessibilityLabel="Password, at least 6 characters"
                placeholder="At least 6 characters"
                placeholderTextColor={colors.hint}
                secureTextEntry
                style={styles.input}
              />
            </View>
            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

            <Button label="Create account" onPress={onSubmit} loading={loading} />
            <Button
              label="I already have an account"
              variant="ghost"
              onPress={() => navigation.navigate('SignIn')}
            />
          </View>

          <Text style={styles.footer}>
            We will not judge how often or how hard you move.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  tag: {
    fontSize: 12,
    color: colors.sage,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    color: colors.ink,
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 34,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
  error: { color: colors.blushAccent, fontSize: 13 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12 },
});
