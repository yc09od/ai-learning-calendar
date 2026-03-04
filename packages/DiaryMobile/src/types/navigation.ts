import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Tabs: undefined;
  Day: { dateTimestamp: number };
};

export type TabParamList = {
  Calendar: undefined;
  AllEntries: undefined;
};

export type CalendarScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Calendar'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AllEntriesScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'AllEntries'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type DayScreenProps = NativeStackScreenProps<RootStackParamList, 'Day'>;
