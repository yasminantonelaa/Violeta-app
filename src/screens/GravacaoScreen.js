import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GravacaoScreen() {
  const [modo, setModo] = useState('audio');
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [gravandoVideo, setGravandoVideo] = useState(false);
  const [gravacao, setGravacao] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [reproducao, setReproducao] = useState(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    configurarAudio();
    carregarRegistros();
    return () => { if (reproducao) reproducao.unloadAsync(); };
  }, []);

  async function configurarAudio() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
  }

  async function carregarRegistros() {
    try {
      const dados = await AsyncStorage.getItem('@gravacoes');
      if (dados) setRegistros(JSON.parse(dados));
    } catch (e) {}
  }

  async function salvarRegistros(lista) {
    await AsyncStorage.setItem('@gravacoes', JSON.stringify(lista));
  }

  async function iniciarAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setGravacao(recording);
      setGravandoAudio(true);
    } catch (err) {
      Alert.alert('Erro', 'Nao foi possivel iniciar a gravacao de audio.');
    }
  }

  async function pararAudio() {
    if (!gravacao) return;
    await gravacao.stopAndUnloadAsync();
    const uri = gravacao.getURI();

    // Salvar na galeria
    if (!mediaPermission?.granted) await requestMediaPermission();
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch (e) {}

    const novo = {
      id: Date.now().toString(),
      tipo: 'audio',
      uri,
      data: new Date().toLocaleString('pt-BR'),
    };
    const lista = [novo, ...registros];
    setRegistros(lista);
    await salvarRegistros(lista);
    setGravacao(null);
    setGravandoAudio(false);
    Alert.alert('Gravacao salva!', 'O audio foi salvo no dispositivo.');
  }

  async function iniciarVideo() {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
      return;
    }
    if (!micPermission?.granted) {
      await requestMicPermission();
      return;
    }
    if (!cameraRef.current) return;
    try {
      setGravandoVideo(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });

      // Salvar na galeria
      if (!mediaPermission?.granted) await requestMediaPermission();
      try {
        await MediaLibrary.saveToLibraryAsync(video.uri);
      } catch (e) {}

      const novo = {
        id: Date.now().toString(),
        tipo: 'video',
        uri: video.uri,
        data: new Date().toLocaleString('pt-BR'),
      };
      const lista = [novo, ...registros];
      setRegistros(lista);
      await salvarRegistros(lista);
      setGravandoVideo(false);
      Alert.alert('Video salvo!', 'O video foi salvo na galeria do dispositivo.');
    } catch (err) {
      setGravandoVideo(false);
      Alert.alert('Erro', 'Nao foi possivel gravar o video.');
    }
  }

  async function pararVideo() {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
  }

  async function reproduzirAudio(uri) {
    try {
      if (reproducao) await reproducao.unloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound } = await Audio.Sound.createAsync({ uri });
      setReproducao(sound);
      await sound.playAsync();
    } catch (err) {
      Alert.alert('Erro', 'Nao foi possivel reproduzir. O arquivo pode ter sido movido.');
    }
  }

  async function compartilhar(uri, tipo) {
    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert('Compartilhamento nao disponivel neste dispositivo.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: tipo === 'audio' ? 'audio/m4a' : 'video/mp4',
        dialogTitle: 'Compartilhar evidencia - Violeta',
      });
    } catch (err) {
      Alert.alert('Erro', 'Nao foi possivel compartilhar o arquivo.');
    }
  }

  async function excluir(id) {
    Alert.alert('Excluir gravacao', 'Tem certeza? Esta acao nao pode ser desfeita.', [
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const lista = registros.filter(r => r.id !== id);
          setRegistros(lista);
          await salvarRegistros(lista);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Gravacao Discreta</Text>

      <View style={styles.seletor}>
        <TouchableOpacity
          style={[styles.botaoModo, modo === 'audio' && styles.modoAtivo]}
          onPress={() => setModo('audio')}
        >
          <Text style={[styles.textoModo, modo === 'audio' && styles.textoModoAtivo]}>
            🎙️ Audio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botaoModo, modo === 'video' && styles.modoAtivo]}
          onPress={() => setModo('video')}
        >
          <Text style={[styles.textoModo, modo === 'video' && styles.textoModoAtivo]}>
            📹 Video
          </Text>
        </TouchableOpacity>
      </View>

      {modo === 'audio' ? (
        <View style={styles.secaoGravacao}>
          <Text style={styles.aviso}>
            {gravandoAudio
              ? '🔴 Gravando... funciona com a tela bloqueada'
              : 'Audio gravado e salvo automaticamente no dispositivo'}
          </Text>
          <TouchableOpacity
            style={[styles.botaoGravar, gravandoAudio && styles.botaoParar]}
            onPress={gravandoAudio ? pararAudio : iniciarAudio}
          >
            <Text style={styles.textoBotaoGravar}>
              {gravandoAudio ? '⏹  Parar Gravacao' : '⏺  Iniciar Gravacao de Audio'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.secaoGravacao}>
          <Text style={styles.aviso}>
            {gravandoVideo ? '🔴 Gravando video...' : 'Video salvo automaticamente na galeria'}
          </Text>
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              mode="video"
              facing="back"
            />
          ) : (
            <TouchableOpacity style={styles.botaoPermissao} onPress={requestCameraPermission}>
              <Text style={styles.textoBotaoGravar}>Permitir acesso a camera</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.botaoGravar, gravandoVideo && styles.botaoParar]}
            onPress={gravandoVideo ? pararVideo : iniciarVideo}
          >
            <Text style={styles.textoBotaoGravar}>
              {gravandoVideo ? '⏹  Parar Video' : '⏺  Iniciar Gravacao de Video'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.secao}>{registros.length} gravacao(oes) salva(s)</Text>

      <FlatList
        data={registros}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTipo}>
                {item.tipo === 'audio' ? '🎙️ Audio' : '📹 Video'}
              </Text>
              <Text style={styles.cardData}>{item.data}</Text>
            </View>
            <View style={styles.cardAcoes}>
              {item.tipo === 'audio' && (
                <TouchableOpacity
                  style={styles.botaoAcao}
                  onPress={() => reproduzirAudio(item.uri)}
                >
                  <Text style={styles.iconeAcao}>▶</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.botaoAcao}
                onPress={() => compartilhar(item.uri, item.tipo)}
              >
                <Text style={styles.iconeAcao}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoAcao}
                onPress={() => excluir(item.id)}
              >
                <Text style={styles.iconeAcaoExcluir}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioIcone}>🎙️</Text>
            <Text style={styles.vazioTexto}>Nenhuma gravacao ainda.</Text>
            <Text style={styles.vazioSub}>As gravacoes ficam salvas aqui e na galeria.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  titulo: { color: '#9C27B0', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  seletor: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#2a2a4e', borderRadius: 10, padding: 4 },
  botaoModo: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  modoAtivo: { backgroundColor: '#6A0DAD' },
  textoModo: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  textoModoAtivo: { color: '#fff' },
  secaoGravacao: { marginBottom: 20 },
  aviso: { color: '#ce93d8', fontSize: 13, marginBottom: 12, fontStyle: 'italic', textAlign: 'center' },
  camera: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  botaoGravar: { backgroundColor: '#6A0DAD', padding: 16, borderRadius: 12, alignItems: 'center' },
  botaoParar: { backgroundColor: '#c62828' },
  botaoPermissao: { backgroundColor: '#333', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  textoBotaoGravar: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secao: { color: '#9C27B0', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#2a2a4e', padding: 14, borderRadius: 10,
    marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#c62828',
  },
  cardInfo: { flex: 1 },
  cardTipo: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardData: { color: '#888', fontSize: 12, marginTop: 2 },
  cardAcoes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botaoAcao: { padding: 8 },
  iconeAcao: { fontSize: 20 },
  iconeAcaoExcluir: { fontSize: 20 },
  vazio: { alignItems: 'center', marginTop: 30 },
  vazioIcone: { fontSize: 40, marginBottom: 8 },
  vazioTexto: { color: '#666', fontSize: 15 },
  vazioSub: { color: '#444', fontSize: 13, marginTop: 4, textAlign: 'center' },
});
