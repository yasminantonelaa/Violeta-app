//  -- Tela de gerenciamento da Rede de Proteção --
//
//  Permite à usuária cadastrar, visualizar e remover os contatos que receberão o alerta de emergência quando o botão SOS dor acionado
//  Os contatos são salvos localmente no AsyncStorage sob a chave @contatos
//
//  Operações disponíveis:
//    - Adicionar um contato (nome + número com DDD)
//    - Remover um contato existente (com confirmação)
//    - Listar todos os contatos cadastrados

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function ContatosScreen() {
  const [nome, setNome] = useState('');           //  texto digitado no campo de nome do novo contato
  const [numero, setNumero] = useState('');       //  texto digitado no campo de número do novo contato
  const [contatos, setContatos] = useState([]);   //  array com todos os contatos salvos

  // escalaAdicionar: escala do botão "Adicionar Contato" ao ser pressionado (1 → 0.96 → 1)
  const escalaAdicionar = useRef(new Animated.Value(1)).current;
 
  // Anima a escala de um botão: comprime levemente ao pressionar e volta ao soltar
  function animarBotao(escala, callback) {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }
   
  //  useFocusEffect recarrega os contatos toda vez que a aba é visitada
  //  O useCallback com [] é obrigatório commo segundo argumento do useFocusEffect
  //    Ele memoriza a função para evitar loops infinitos de re-renderização
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  //  Carrega a lista de contatos do AsyncStorage 
  //  O try/catch captura possíveis erros de leitura (ex: dados corrompidos) 
  //  e, nesse caso, exibe a lista vazia em vez de travar o app
  async function carregar() {
    try {
      const dados = await AsyncStorage.getItem('@contatos');
      if (dados) setContatos(JSON.parse(dados));
      else setContatos([]);
    } catch (e) {
      console.log('Erro ao carregar:', e);
    }
  }

  //  Adiciona um novo contato à lista
  //  O fluxo é:
  //    1. Validação: ambos os campos precisam estar preenchidos
  //    2. Criação do objeto do contato com id único via Date.now()
  //    3. Atualização do estado local (para a UI atualizar imediatamente)
  //    4. Persistência no AsyncStorage (para sobreviver ao fechar o app)
  //    5. Limpeza dos campos de texto para o próximo cadastro
  //
  //  A atualização do estado e a persistência acontecem juntas para manter
  //  a UI e o banco local sempre atualizados
  async function salvar() {
    // Validação básica: os dois campos são obrigatórios
    if (!nome.trim() || !numero.trim()) {
      Alert.alert('Atenção', 'Preencha nome e número antes de adicionar.');
      return;
    }
    // Cria o objeto do contato com id único baseado no timestamp atual
    const novo = {
      id: Date.now().toString(),
      nome: nome.trim(),
      numero: numero.trim()
    };

    // Adiciona ao array existente e salva o array completo no AsyncStorage
    const lista = [...contatos, novo];
    setContatos(lista);
    await AsyncStorage.setItem('@contatos', JSON.stringify(lista));

    // Limpa os campos para facilitar o cadastro do próximo contato
    setNome('');
    setNumero('');
  }

  //  Remove um contato da lista após confirmação do usuário
  //
  //  A remoção usa .filter() para criar um novo array sem o contato cujo o id foi passado
  //  
  //  O alert com style: 'destructive' faz o botão aparecer em vermelho no iOS,
  //  sinalizando visualmente que a ação não pode ser feita
  async function remover(id) {
    Alert.alert('Remover contato', 'Tem certeza?', [
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          //  Filtra fora do contato com o id correspondente
          const lista = contatos.filter(c => c.id !== id);
          setContatos(lista);
          await AsyncStorage.setItem('@contatos', JSON.stringify(lista));
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Rede de Proteção</Text>
      <Text style={styles.subtitulo}>
        Essas pessoas receberão seu alerta de emergência
      </Text>

      {/* Campo de nome do novo contato */}
      <TextInput
        style={styles.input}
        placeholder="Nome do contato"
        placeholderTextColor="#AB92BF"
        value={nome}
        onChangeText={setNome}
      />
      {/* Campo de número: keyboardType="phone-pad" abre o teclado numérico 
          de telefone no celular, facilitando a digitação do número com DDD */}
      <TextInput
        style={styles.input}
        placeholder="Número com DDD (ex: 86999999999)"
        placeholderTextColor="#AB92BF"
        value={numero}
        onChangeText={setNumero}
        keyboardType="phone-pad"
      />

      {/* Botão de adicionar: só persiste se a validação em salvar() passar */}
      <Animated.View style={{ transform: [{ scale: escalaAdicionar }] }}>
        <TouchableOpacity
          style={styles.botao}
          onPress={() => animarBotao(escalaAdicionar, salvar)}
        >
          <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.textoBotao}>+ Adicionar Contato</Text>
        </TouchableOpacity>
      </Animated.View>
 
      {/* Contador dinâmico que atualiza conforme contatos são adicionados/removidos */}
      <Text style={styles.secao}>
        {contatos.length} contato(s) cadastrado(s)
      </Text>

      {/* FlatList é a forma correta de redenrizar listas longas no React Native
          Ao contrário de um .map() dentro de um ScrollView, a FlatList só redenriza
          os itens visíveis na tela */}
      <FlatList
        data={contatos}                   //  o array de contatos a exibir
        keyExtractor={item => item.id}    //  função que retorna a chave única de cada item
        renderItem={({ item }) => (       //  função que define como cada item é renderizado
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.nomeContato}>{item.nome}</Text>
              <Text style={styles.numContato}>{item.numero}</Text>
            </View>
            {/* Botão de remoção individual: passa o id do item para a função remover() */}
            <TouchableOpacity
              style={styles.botaoRemover}
              onPress={() => remover(item.id)}
            >
              <Ionicons name="close-circle-outline" size={26} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="people-outline" size={52} color="#3D3468" style={{ marginBottom: 12 }} />            
            <Text style={styles.vazioTexto}>Nenhum contato cadastrado ainda.</Text>
            <Text style={styles.vazioSub}>Adicione pessoas de confiança acima.</Text>
          </View>
        }
      />
    </View>
  );
}

// -- Estilos --
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1A2E', padding: 20 },
  titulo: { color: '#F2FDFF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { color: '#DBCBD8', fontSize: 13, marginBottom: 20, fontStyle: 'italic' },
  input: {
    backgroundColor: '#2D2450',
    color: '#F2FDFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3D3468',
    fontSize: 15,
  },
  botao: {
    backgroundColor: '#564787',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secao: { color: '#AB92BF', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#2D2450',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,           // barra roxa na borda esquerda de cada card
    borderLeftColor: '#564787',
  },
  cardInfo: { flex: 1 },
  nomeContato: { color: '#F2FDFF', fontWeight: 'bold', fontSize: 15 },
  numContato: { color: '#AB92BF', fontSize: 13, marginTop: 2 },
  botaoRemover: { padding: 8 },
  vazio: { alignItems: 'center', marginTop: 40 },
  vazioIcone: { fontSize: 48, marginBottom: 12 },
  vazioTexto: { color: '#DBCBD8', fontSize: 16, marginBottom: 6 },
  vazioSub: { color: '#AB92BF', fontSize: 13 },
});
