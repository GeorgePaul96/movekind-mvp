import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

/** A line icon. Always decorative: the control or text beside it carries the label. */
export function Icon({ name, size = 22, color = colors.primary }: Props) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
