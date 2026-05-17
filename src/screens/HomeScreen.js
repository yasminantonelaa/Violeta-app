import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Linking, Vibration
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [localizacao, setLocalizacao] = useState(null);
  const [contatosSalvos, setContatosSalvos] = useState([]);

  useEffect(() => {
    carregarContatos();
    pedirPermissaoLocalizacao();
  }, []);

  async function pedirPermissaoLocalizacao() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocalizacao(loc.coords);
    }
  }

  async function carregarContatos() {
    const dados = await AsyncStorage.getItem('@contatos');
    if (dados) setContatosSalvos(JSON.parse(dados));
  }

  async function acionarSOS() {
    // Vibração de alerta
    Vibration.vibrate([500, 200, 500, 200, 500]);

    // Pegar localização atualizada
    let coords = localizacao;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      coords = loc.coords;
    } catch (e) {}

    const linkMapa = coords
      ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
      : 'Localização indisponível';

    const mensagem = `🚨 ALERTA DE EMERGÊNCIA - VIOLETA\nPreciso de ajuda! Minha localização: ${linkMapa}`;

    const numeros = contatosSalvos.map(c => c.numero);

    if (numeros.length === 0) {
      Alert.alert(
        'Nenhum contato cadastrado',
        'Cadastre contatos de emergência antes de usar o SOS.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Enviar SMS
    const { result } = await SMS.sendSMSAsync(numeros, mensagem);

    // Abrir discador com 190 preenchido
    Alert.alert(
      '🚨 SOS Acionado',
      'SMS enviado para seus contatos. Deseja ligar para a Polícia (190)?',
      [
        {
          text: 'Ligar 190',
          onPress: () => Linking.openURL('tel:190'),
          style: 'destructive',
        },
        { text: 'Fechar', style: 'cancel' },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>VIOLETA</Text>
      <Text style={styles.subtitulo}>Silêncio Nunca Mais</Text>

      <TouchableOpacity
        style={styles.botaoSOS}
        onPress={acionarSOS}
        activeOpacity={0.8}
      >
        <Text style={styles.textoBotao}>SOS</Text>
        <Text style={styles.textoBotaoSub}>Pressione em caso de emergência</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        {contatosSalvos.length} contato(s) cadastrado(s)
      </Text>
      <Text style={styles.infoLoc}>
        {localizacao ? '📍 Localização ativa' : '📍 Sem localização'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9C27B0',
    letterSpacing: 6,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#ce93d8',
    marginBottom: 60,
    fontStyle: 'italic',
  },
  botaoSOS: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#c62828',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 40,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 52,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  textoBotaoSub: {
    color: '#ffcdd2',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  info: { color: '#ce93d8', fontSize: 14, marginTop: 10 },
  infoLoc: { color: '#81c784', fontSize: 13, marginTop: 6 },
});