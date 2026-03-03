import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Calendar: undefined;
  Day: { dateTimestamp: number };
};

export type CalendarScreenProps = NativeStackScreenProps<RootStackParamList, 'Calendar'>;
export type DayScreenProps = NativeStackScreenProps<RootStackParamList, 'Day'>;
