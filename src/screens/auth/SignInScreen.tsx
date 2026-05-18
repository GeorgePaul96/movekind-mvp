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

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in');
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
            <Text style={styles.tag}>Welcome back</Text>
            <Text style={styles.title}>Move kindly,{'\n'}with intention</Text>
          </View>

          <View style={{ gap: 12, marginTop: 24 }}>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
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
                placeholder="Your password"
                placeholderTextColor={colors.hint}
                secureTextEntry
                style={styles.input}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Sign in" onPress={onSubmit} loading={loading} />
            <Button
              label="Create an account"
              variant="ghost"
              onPress={() => navigation.navigate('SignUp')}
            />
          </View>

          <Text style={styles.footer}>
            Rest is part of progress.
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
