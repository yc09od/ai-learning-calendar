import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../types/navigation';
import CalendarScreen from '../screens/CalendarScreen';
import AllEntriesScreen from '../screens/AllEntriesScreen';
import DayScreen from '../screens/DayScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const GREEN = '#4CAF50';
const SZ = 22;   // icon base size (dp)
const LW = 1.8;  // line stroke width

// ─── Diary / Notebook icon ────────────────────────────────────────────────────
// Outer rectangle with left spine + 3 horizontal lines inside
function DiaryIcon({ color }: { color: string }) {
  return (
    <View style={{ width: SZ, height: SZ * 1.1 }}>
      {/* outer frame */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderWidth: LW, borderColor: color, borderRadius: 2,
      }} />
      {/* spine divider */}
      <View style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: SZ * 0.18,
        borderRightWidth: LW, borderRightColor: color,
      }} />
      {/* content lines */}
      {[0.27, 0.47, 0.67].map((yRatio, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: SZ * 0.28, right: SZ * 0.1,
          top: SZ * 1.1 * yRatio,
          height: LW,
          backgroundColor: color,
        }} />
      ))}
    </View>
  );
}

// ─── List icon ────────────────────────────────────────────────────────────────
// 3 rows each with a small dot bullet + horizontal line
function ListIcon({ color }: { color: string }) {
  const h = SZ * 0.82;
  const rows = [0.1, 0.45, 0.8];
  return (
    <View style={{ width: SZ, height: h }}>
      {rows.map((yRatio, i) => (
        <View key={i} style={{
          position: 'absolute',
          top: h * yRatio,
          left: 0, right: 0,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 3.5, height: 3.5, borderRadius: 2,
            backgroundColor: color,
            marginRight: SZ * 0.16,
          }} />
          <View style={{ flex: 1, height: LW, backgroundColor: color }} />
        </View>
      ))}
    </View>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GREEN },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#bbb',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e8e8e8',
          height: 52,
        },
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: '我的日记本',
          tabBarIcon: ({ color }) => <DiaryIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="AllEntries"
        component={AllEntriesScreen}
        options={{
          title: '所有日记',
          tabBarIcon: ({ color }) => <ListIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Day"
          component={DayScreen}
          options={{
            title: '',
            headerStyle: { backgroundColor: GREEN },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
