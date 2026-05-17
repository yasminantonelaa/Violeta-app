import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ContatosScreen() {
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [contatos, setContatos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  async function carregar() {
    try {
      const dados = await AsyncStorage.getItem('@contatos');
      if (dados) setContatos(JSON.parse(dados));
      else setContatos([]);
    } catch (e) {
      console.log('Erro ao carregar:', e);
    }
  }

  async function salvar() {
    if (!nome.trim() || !numero.trim()) {
      Alert.alert('Atenção', 'Preencha nome e número antes de adicionar.');
      return;
    }
    const novo = { id: Date.now().toString(), nome: nome.trim(), numero: numero.trim() };
    const lista = [...contatos, novo];
    setContatos(lista);
    await AsyncStorage.setItem('@contatos', JSON.stringify(lista));
    setNome('');
    setNumero('');
  }

  async function remover(id) {
    Alert.alert('Remover contato', 'Tem certeza?', [
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
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

      <TextInput
        style={styles.input}
        placeholder="Nome do contato"
        placeholderTextColor="#888"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Número com DDD (ex: 86999999999)"
        placeholderTextColor="#888"
        value={numero}
        onChangeText={setNumero}
        keyboardType="phone-pad"
      />
      <TouchableOpacity style={styles.botao} onPress={salvar}>
        <Text style={styles.textoBotao}>+ Adicionar Contato</Text>
      </TouchableOpacity>

      <Text style={styles.secao}>
        {contatos.length} contato(s) cadastrado(s)
      </Text>

      <FlatList
        data={contatos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.nomeContato}>{item.nome}</Text>
              <Text style={styles.numContato}>{item.numero}</Text>
            </View>
            <TouchableOpacity
              style={styles.botaoRemover}
              onPress={() => remover(item.id)}
            >
              <Text style={styles.remover}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
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
    borderLeftWidth: 4,
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
