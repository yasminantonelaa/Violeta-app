//  -- Tela principal: Botão SOS --
//
//  Está é a tela mais crítica do aplicativo
//  Seu único proposito é acionar uma sequência de ações de emergência
//  com um único toque, minimizando o tempo necessário para pedir ajuda
//
//  Sequência de ações ao pressionar SOS:
//    1. Vibração do dispositivo - feedback físicoimediato
//    2. Captura da localização GPS atualizada
//    3. Montagem da mensagem de emergência com link do Google Maps
//    4. Envio de SMS para todos os contatos cadastrados
//    5. Oferta de ligar par o 190 (Polícia Militar)
//
//  A tela também exibe o status atual de dois recursos essenciais:
//    Quantos contatos estão cadastrados e se o GPS está ativo

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Linking, Vibration, Animated
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {

  //  Recursos necessários para o SOS funcionar:
  const [localizacao, setLocalizacao] = useState(null);     //  objeto com latitude e longitude obtidos pelo GPS
                                                            //  começa como null enquanto a permissão não for concedida ou o GPS não responder

  const [contatosSalvos, setContatosSalvos] = useState([]); //  array de contatos carregados do AsyncStorage
                                                            //  sem contatos, o SOS não tem para quem enviar o SMS

  // pulso: valor animado que vai de 1 → 1.06 → 1 em loop contínuo
  // Cria a sensação de que o botão está "respirando" e pronto para ser acionado
  const pulso = useRef(new Animated.Value(1)).current;
 
  //  Ao montar a tela pela primeira vez, dispara duas operções em paralelo
  //  Ambas são iniciadas juntas para não atrasar uma esperando a outra
  useEffect(() => {
    carregarContatos();           //  busca a lista de contatos salvos 
    pedirPermissaoLocalizacao();  //  solicita acesso ao GPS
    iniciarPulso();
  }, []);

  // Cria um loop infinito de escala: expande 6% e volta ao tamanho original
  // Animated.loop repete a sequência indefinidamente
  // duration: 1200ms por ciclo — lento o suficiente para ser suave, não ansioso
  function iniciarPulso() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }
 
  //  Solicita permissão de localização em primeiro plano e, se concedida,
  //  obtém as coorfenadas atuais para ter uma posição de partida disponível
  async function pedirPermissaoLocalizacao() {
    const { status } = await Location.requestForegroundPermissionsAsync(); //  "Foreground Permissions" significa que o app só
                                                                          //    acessa o GPS enquanto está aberto na tela
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocalizacao(loc.coords);
    }
  }

  //  Carrega os contatos de emergência do AsyncStorage
  //  Chamado na montagem de tela para que o contador de contatos e a 
  //  lista de destinatários do SMS estejam prontos quando o SOS for acionado
  async function carregarContatos() {
    const dados = await AsyncStorage.getItem('@contatos');
    if (dados) setContatosSalvos(JSON.parse(dados));
  }

  //  Função central do aplicativo: acima de toda a sequência de emergência
  //    - A localização é buscada novamente no momento do acionamento para ser a mais recente possível
  //    - Se a nova busca de GPS falhar por qualquer motivo, usa a última localização conhecida como fallback
  //    - Se não houver nenhuma localização, a mensagem ainda é enviada, apenas sem o link do mapa
  async function acionarSOS() {
    //  Vibração - feedback tátil confirma que o botão foi pressionado
    //  O padrão significa: vibrar 500ms -> pausa 200ms -> vibrar 500ms -> pausa 200ms -> vibrar 500ms
    Vibration.vibrate([500, 200, 500, 200, 500]);

    //  Busca localização atualizada; usa a anterior como fallback
    let coords = localizacao;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      coords = loc.coords;
    } catch (e) {
      //  Se falhar, coords ainda tem o valor de localização (pode ser null)
      console.log('Não foi possível atualizar localização no SOS:', e);
    }

    //  Monta o link do Google Maps ou uma mensagem fallback
    const linkMapa = coords
      ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
      : 'Localização indisponível';

    //  Mensagem que será enviada por SMS para todos os contatos
    const mensagem = `🚨 ALERTA DE EMERGÊNCIA - VIOLETA\nPreciso de ajuda! Minha localização: ${linkMapa}`;

    //  Extrai apenas os números de telefone da lista de contatos
    const numeros = contatosSalvos.map(c => c.numero);

    //  Sem contatos, o SOS não pode avisar ninguém
    if (numeros.length === 0) {
      Alert.alert(
        'Nenhum contato cadastrado',
        'Cadastre contatos de emergência antes de usar o SOS.',
        [{ text: 'OK' }]
      );
      return;
    }

    //  Abre o app de SMS nativo com os números e a mensagem preenchidos
    const { result } = await SMS.sendSMSAsync(numeros, mensagem);

    //  Oferece ligar para a Polícia Militar
    //  A usuária ainda precisa confirmar a ligação
    Alert.alert(
      '🚨 SOS Acionado',
      'SMS enviado para seus contatos. Deseja ligar para a Polícia (190)?',
      [
        {
          text: 'Ligar 190',
          onPress: () => Linking.openURL('tel:190'),    //  abre o discador nativo com o número já preenchido
          style: 'destructive',     //  vermelho no iOS para reforçar a urgência
        },
        { text: 'Fechar', style: 'cancel' },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho com nome e slogan do app */}
      <Text style={styles.titulo}>VIOLETA</Text>
      <Text style={styles.subtitulo}>Silêncio Nunca Mais</Text>

      {/* Botão SOS circular: activeOpacity={0.8} faz o botão escurecer levemente ao ser pressionado, dando feedback visual além do tátil
          O borderRadius igual à metade da largura/altura (110 = 220/2) garante o formato perfeitamente circular */}
      <Animated.View style={{ transform: [{ scale: pulso }] }}>
        <TouchableOpacity
          style={styles.botaoSOS}
          onPress={acionarSOS}
          activeOpacity={0.8}
        >
          <Text style={styles.textoBotao}>SOS</Text>
          <Text style={styles.textoBotaoSub}>Pressione em caso de emergência</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Indicadores de status: informam se o SOS está pronto para funcionar */}
      <Text style={styles.info}>
        {contatosSalvos.length} contato(s) cadastrado(s)
      </Text>
      <Text style={styles.infoLoc}>
        {/* Operador ternário: exibe mensagem diferente conforme o GPS estar ativo ou não */}
        {localizacao ? '📍 Localização ativa' : '📍 Sem localização'}
      </Text>
    </View>
  );
}

//  -- Estilos --
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F2FDFF',
    letterSpacing: 6,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#DBCBD8',
    marginBottom: 60,
    fontStyle: 'italic',
  },
  botaoSOS: {
    width: 220,
    height: 220,
    borderRadius: 110,    // metade de 220 -> círculo perfeito
    backgroundColor: '#c62828',
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra vermelha ao redor do botão (iOS) — cria o efeito de "brilho"
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 0 },  // sombra em todas as direções
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,    //  sombra no Android
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
  info: { color: '#DBCBD8', fontSize: 14, marginTop: 10 },
  infoLoc: { color: '#AB92BF', fontSize: 13, marginTop: 6 },  // verde para indicar status positivo
});
