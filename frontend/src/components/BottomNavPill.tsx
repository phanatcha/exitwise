import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Home, Sparkles, Bookmark, User } from 'lucide-react-native';
import { colors, neuRaised } from '../theme';

// Rounded-50 pill at the bottom of the main screens.
// Figma originally showed three tabs (Home / Planner / Saved); we added
// Profile as a fourth so users can tweak travel mode, budget, walking limit,
// and sign out without needing a header button on every screen.

export type NavTab = 'home' | 'planner' | 'saved' | 'profile';

interface Props {
  current: NavTab;
  onSelect: (tab: NavTab) => void;
  style?: ViewStyle;
}

const ITEMS: Array<{ key: NavTab; Icon: React.ComponentType<any> }> = [
  { key: 'home', Icon: Home },
  { key: 'planner', Icon: Sparkles },
  { key: 'saved', Icon: Bookmark },
  { key: 'profile', Icon: User },
];

export const BottomNavPill: React.FC<Props> = ({ current, onSelect, style }) => {
  return (
    <View style={[styles.wrap, neuRaised, style]}>
      {ITEMS.map(({ key, Icon }) => {
        const active = key === current;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={({ pressed }) => [
              styles.item,
              active && styles.itemActive,
              pressed && styles.itemPressed,
            ]}
            hitSlop={8}
          >
            <Icon
              color={active ? colors.textInverse : colors.primary}
              size={22}
              strokeWidth={active ? 2.25 : 1.75}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bgStart,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  item: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  itemPressed: {
    opacity: 0.75,
  },
});
