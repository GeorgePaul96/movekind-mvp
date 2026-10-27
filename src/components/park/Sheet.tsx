import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors, elevation } from '@/constants/colors';
import { SHEET_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** The small sheet a park object opens: handle, title, content, a quiet Close. */
export function Sheet({ visible, title, subtitle, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
            <Button label={SHEET_COPY.close} variant="link" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 28,
    ...elevation.raised,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.divider, marginBottom: 14 },
  title: { ...font.bold, fontSize: 24, color: colors.textPrimary },
  subtitle: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 4, marginBottom: 14 },
});
