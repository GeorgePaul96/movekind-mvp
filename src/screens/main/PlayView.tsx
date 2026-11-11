import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { colors, elevation } from '@/constants/colors';
import { PLAY_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { GAME_IDS, type GameId } from '@/domain/games/games';

const GAME_ICONS: Record<GameId, IconName> = {
  pattern: 'view-grid-outline',
  sequence: 'order-numeric-ascending',
  ink: 'format-color-text',
  switch: 'shape-outline',
  pairs: 'cards-outline',
};

/** The Play tab: a few small games, and a plain statement of what they are and are not. */
export default function PlayView({ onPlay }: { onPlay: (id: GameId) => void }) {
  return (
    <View>
      <Text style={styles.intro}>{PLAY_COPY.intro}</Text>
      {GAME_IDS.map((id) => (
        <View key={id} style={styles.row}>
          <View style={styles.rowIcon}>
            <Icon name={GAME_ICONS[id]} size={26} color={colors.primary} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.name}>{PLAY_COPY.games[id].name}</Text>
            <Text style={styles.what}>{PLAY_COPY.games[id].what}</Text>
          </View>
          <View style={styles.action}>
            <Button
              label={PLAY_COPY.title}
              size="sm"
              accessibilityLabel={PLAY_COPY.playA11y(PLAY_COPY.games[id].name)}
              onPress={() => onPlay(id)}
            />
          </View>
        </View>
      ))}
      <Card tone="soft" style={styles.honest}>
        <Text style={styles.honestTitle}>{PLAY_COPY.honestTitle}</Text>
        <Text style={styles.honestBody}>{PLAY_COPY.honest}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { ...font.medium, fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 14,
    marginBottom: 10,
    ...elevation.card,
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  name: { ...font.bold, fontSize: 17, color: colors.textPrimary },
  what: { ...font.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 1 },
  action: { width: 76 },
  honest: { marginTop: 8 },
  honestTitle: { ...font.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 4 },
  honestBody: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
