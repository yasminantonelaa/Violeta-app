import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import ContatosScreen from './src/screens/ContatosScreen';
import GravacaoScreen from './src/screens/GravacaoScreen';
import MapaScreen from './src/screens/MapaScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [tela, setTela] = useState('carregando');

  useEffect(() => {
    verificarLogin();
  }, []);

  async function verificarLogin() {
    const usuario = await AsyncStorage.getItem('@usuarioLogado');
    setTela(usuario ? 'app' : 'login');
  }

  async function sair() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('@usuarioLogado');
          setTela('login');
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  if (tela === 'carregando') return null;
  if (tela === 'login') return (
    <LoginScreen
      onLogin={() => setTela('app')}
      onIrCadastro={() => setTela('cadastro')}
    />
  );
  if (tela === 'cadastro') return (
    <CadastroScreen
      onCadastro={() => setTela('app')}
      onVoltar={() => setTela('login')}
    />
  );

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#C48BAF',
          tabBarInactiveTintColor: '#B8A0C8',
          tabBarStyle: { backgroundColor: '#F5E6F0', borderTopColor: '#E8C8DE' },
          headerStyle: { backgroundColor: '#D4A0C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity onPress={sair} style={{ marginRight: 16 }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>Sair 🚪</Text>
            </TouchableOpacity>
          ),
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
