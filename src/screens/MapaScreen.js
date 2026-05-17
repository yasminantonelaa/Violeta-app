import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';

const PONTOS_INICIAIS = [
  { id: '1', titulo: 'Estacionamento Sul', descricao: 'Iluminacao precaria a noite', hora: '22:30' },
  { id: '2', titulo: 'Corredor Bloco B', descricao: 'Pouco movimento no periodo noturno', hora: '21:00' },
  { id: '3', titulo: 'Parada de onibus', descricao: 'Sem seguranca apos as 20h', hora: '20:00' },
];

export default function MapaScreen() {
  const [pontos, setPontos] = useState(PONTOS_INICIAIS);

  function adicionarPonto() {
    Alert.alert(
      'Reportar Ponto de Risco',
      'Deseja registrar sua localizacao atual como ponto de atencao?',
      [
        {
          text: 'Confirmar',
          onPress: () => {
            const novo = {
              id: Date.now().toString(),
              titulo: 'Ponto reportado por voce',
              descricao: 'Registrado agora',
              hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            };
            setPontos(prev => [novo, ...prev]);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  function removerPonto(id) {
    Alert.alert('Remover ponto', 'Deseja remover este ponto de risco?', [
      { text: 'Remover', style: 'destructive', onPress: () => setPontos(prev => prev.filter(p => p.id !== id)) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Pontos de Risco</Text>
      <Text style={styles.subtitulo}>{pontos.length} local(is) de atencao no campus</Text>

      <View style={styles.legenda}>
        <Text style={styles.legendaTexto}>⚠️  Toque em um ponto para remover</Text>
      </View>

      <FlatList
        data={pontos}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onLongPress={() => removerPonto(item.id)}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcone}>📍</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardDesc}>{item.descricao}</Text>
              <Text style={styles.cardHora}>Horario de risco: {item.hora}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>Nenhum ponto registrado ainda.</Text>
            <Text style={styles.vazioSub}>Use o botao abaixo para reportar.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.botao} onPress={adicionarPonto}>
        <Text style={styles.textoBotao}>+ Reportar Ponto de Risco</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  titulo: { color: '#9C27B0', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { color: '#ce93d8', fontSize: 13, marginBottom: 12 },
  legenda: { backgroundColor: '#2a2a4e', padding: 10, borderRadius: 8, marginBottom: 14 },
  legendaTexto: { color: '#aaa', fontSize: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  cardLeft: { justifyContent: 'center', marginRight: 12 },
  cardIcone: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitulo: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  cardDesc: { color: '#ce93d8', fontSize: 13, marginBottom: 4 },
  cardHora: { color: '#888', fontSize: 12 },
  vazio: { alignItems: 'center', marginTop: 40 },
  vazioTexto: { color: '#666', fontSize: 16, marginBottom: 6 },
  vazioSub: { color: '#444', fontSize: 13 },
  botao: { backgroundColor: '#6A0DAD', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
