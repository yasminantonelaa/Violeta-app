// Ponto de entrada e controlador de autenticação.
// Primeiro arquivo executado quando o aplicativo abre
// Duas responsibilidades principais:
//    1. Autenticação: decide qual "tela raiz" baseada se há uma sessão ativa salva no dispostivo
//    2. Navegação principal: quando a usuária já está logada, monta o sistema de abas com as quatro telas do app

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importação de todas as telas do aplicativo
import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import ContatosScreen from './src/screens/ContatosScreen';
import GravacaoScreen from './src/screens/GravacaoScreen';
import MapaScreen from './src/screens/MapaScreen';

// Cria o navegador de abas inferiores (a barra no fundo da tela)
const Tab = createBottomTabNavigator();

export default function App() {
  // Estado central que cotrola qual tela raiz está visível
  // Começa como 'carregando' para evitar um "flash" de tela errada enquanto o AsyncStorage ainda está sendo consultado
  const [tela, setTela] = useState('carregando');

  // Executa uma única vez, logo após o primeiro render
  // É o momento certo para verificar a sessão, pois a tela ainda está "em branco" 
  // Retorna null enquanto carrega
  useEffect(() => {
    verificarLogin();
  }, []);

  // Consulta o AsyncStorage para saber se há uma sessão ativa
  // Se @usuarioLogado existir, a usuária já estava logada e vai direto para o app
  // Caso contrário, é direcionada para o login
  async function verificarLogin() {
    const usuario = await AsyncStorage.getItem('@usuarioLogado');
    setTela(usuario ? 'app' : 'login');
  }

  // Exibe um diálogo de confirmação antes de encerrar a sessão
  // Caso confirmado, remove @usuarioLogado do AsyncStorage e volta para a tela de login
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
  // -- Renderização condicional baseada no estado de autenticação --

  // Enquanto verifica a sessão, não renderiza nada
  if (tela === 'carregando') return null;

  // Tela de login: passa callbacks para navegar para o app ou para o cadastro
  if (tela === 'login') return (
    <LoginScreen
      onLogin={() => setTela('app')}
      onIrCadastro={() => setTela('cadastro')}
    />
  );

  // Tela de cadastro: ao concluir vai para o app; ao voltar, vai para o login
  if (tela === 'cadastro') return (
    <CadastroScreen
      onCadastro={() => setTela('app')}
      onVoltar={() => setTela('login')}
    />
  );

  // -- Aplicativo principal --

  // NavigationContainer é o componente raiz obrigatório do React Navigation
  //   Gerencia o histórico de navegação e o estado das rotas
  
  // Tab.Navigator cria a barra de abas na parte inferior da tela
  // screenOptions define o visual padrão aplicando a todas as abas
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#C48BAF',    // cor do ícone/texto da aba ativa
          tabBarInactiveTintColor: '#B8A0C8',  // cor das abas inativas
          tabBarStyle: { backgroundColor: '#F5E6F0', borderTopColor: '#E8C8DE' },
          headerStyle: { backgroundColor: '#D4A0C0' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },

          // Botão "sair" exibido no canto direito do cabeçalho em todas as abas
          headerRight: () => (
            <TouchableOpacity onPress={sair} style={{ marginRight: 16 }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>Sair 🚪</Text>
            </TouchableOpacity>
          ),
        }}
      >
        {/* Aba 1: Botão SOS - tela principal do app */}
        <Tab.Screen
          name="SOS"
          component={HomeScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚨</Text> }}
        />
        {/* Aba 2: Rede de Proteção - gerenciamento de contatos de emergência */}
        <Tab.Screen
          name="Contatos"
          component={ContatosScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text> }}
        />
        {/* Aba 3: Gravação - registro sigiloso de áudio e vídeo */}
        <Tab.Screen
          name="Gravar"
          component={GravacaoScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎙️</Text> }}
        />
        {/* Aba 4: Mapa - pontos de riscos e atenção no campus */}
        <Tab.Screen
          name="Mapa"
          component={MapaScreen}
          options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
