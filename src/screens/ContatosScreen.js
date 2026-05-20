//  -- Tela de gerenciamento da Rede de Proteção --
//
//  Permite à usuária cadastrar, visualizar e remover os contatos que receberão o alerta de emergência quando o botão SOS dor acionado
//  Os contatos são salvos localmente no AsyncStorage sob a chave @contatos
//
//  Operações disponíveis:
//    - Adicionar um contato (nome + número com DDD)
//    - Remover um contato existente (com confirmação)
//    - Listar todos os contatos cadastrados

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ContatosScreen() {
  const [nome, setNome] = useState('');           //  texto digitado no campo de nome do novo contato
  const [numero, setNumero] = useState('');       //  texto digitado no campo de número do novo contato
  const [contatos, setContatos] = useState([]);   //  array com todos os contatos salvos

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
        placeholderTextColor="#888"
        value={nome}
        onChangeText={setNome}
      />
      {/* Campo de número: keyboardType="phone-pad" abre o teclado numérico 
          de telefone no celular, facilitando a digitação do número com DDD */}
      <TextInput
        style={styles.input}
        placeholder="Número com DDD (ex: 86999999999)"
        placeholderTextColor="#888"
        value={numero}
        onChangeText={setNumero}
        keyboardType="phone-pad"
      />

      {/* Botão de adicionar: só persiste se a validação em salvar() passar */}
      <TouchableOpacity style={styles.botao} onPress={salvar}>
        <Text style={styles.textoBotao}>+ Adicionar Contato</Text>
      </TouchableOpacity>

      {/* Contador dinâmico que atualiza conforme contatos são adicionados/removidos */}
      <Text style={styles.secao}>
        {contatos.length} contato(s) cadastrado(s)
      </Text>

      {/* FlatList é a forma correta de redenrizar listas longas no React Native
          Ao contrário de um .map() dentro de um ScrollView, a FlatList só redenriza
          os itens visíveis na tela*/}
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
              <Text style={styles.remover}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Componente exibido automaticamente quando data é um array vazio */}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioIcone}>👥</Text>
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
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  titulo: { color: '#9C27B0', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { color: '#ce93d8', fontSize: 13, marginBottom: 20, fontStyle: 'italic' },
  input: {
    backgroundColor: '#2a2a4e',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    fontSize: 15,
  },
  botao: {
    backgroundColor: '#6A0DAD',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secao: { color: '#9C27B0', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#2a2a4e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,           // barra roxa na borda esquerda de cada card
    borderLeftColor: '#9C27B0',
  },
  cardInfo: { flex: 1 },
  nomeContato: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  numContato: { color: '#ce93d8', fontSize: 13, marginTop: 2 },
  botaoRemover: { padding: 8 },
  remover: { color: '#f44336', fontSize: 22, fontWeight: 'bold' },
  vazio: { alignItems: 'center', marginTop: 40 },
  vazioIcone: { fontSize: 48, marginBottom: 12 },
  vazioTexto: { color: '#666', fontSize: 16, marginBottom: 6 },
  vazioSub: { color: '#444', fontSize: 13 },
});
