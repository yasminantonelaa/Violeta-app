import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ContatosScreen from './src/screens/ContatosScreen';
import GravacaoScreen from './src/screens/GravacaoScreen';
import MapaScreen from './src/screens/MapaScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#9C27B0',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#333' },
          headerStyle: { backgroundColor: '#6A0DAD' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Tab.Screen
          name="SOS"
          component={HomeScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚨</Text> }}
        />
        <Tab.Screen
          name="Contatos"
          component={ContatosScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text> }}
        />
        <Tab.Screen
          name="Gravar"
          component={GravacaoScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎙️</Text> }}
        />
        <Tab.Screen
          name="Mapa"
          component={MapaScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}