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
    pedirPermissaoGaleria();
    return () => { if (reproducao) reproducao.unloadAsync(); };
  }, []);

  async function pedirPermissaoGaleria() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à galeria para salvar as gravações como evidências.',
        [{ text: 'OK' }]
      );
    }
  }

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

  async function salvarNaGaleria(uri) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sem permissão', 'Permissão de galeria negada. O arquivo foi salvo apenas no app.');
        return false;
      }
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Violeta', asset, false);
      return true;
    } catch (e) {
      console.log('Erro ao salvar na galeria:', e);
      return false;
    }
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
      Alert.alert('Erro', 'Não foi possível iniciar a gravação de áudio.');
    }
  }

  async function pararAudio() {
    if (!gravacao) return;
    try {
      await gravacao.stopAndUnloadAsync();
      const uri = gravacao.getURI();

      const salvouNaGaleria = await salvarNaGaleria(uri);

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

      Alert.alert(
        'Áudio salvo! 🎙️',
        salvouNaGaleria
          ? 'Gravação salva no app e na galeria (álbum Violeta).'
          : 'Gravação salva no app.'
      );
    } catch (err) {
      setGravandoAudio(false);
      Alert.alert('Erro', 'Não foi possível salvar o áudio.');
    }
  }

  async function iniciarVideo() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para gravar vídeo.');
        return;
      }
    }
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso ao microfone para gravar vídeo.');
        return;
      }
    }
    if (!cameraRef.current) {
      Alert.alert('Erro', 'Câmera não está pronta. Aguarde um momento.');
      return;
    }
    try {
      setGravandoVideo(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });

      if (!video?.uri) {
        setGravandoVideo(false);
        return;
      }

      const salvouNaGaleria = await salvarNaGaleria(video.uri);

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

      Alert.alert(
        'Vídeo salvo! 📹',
        salvouNaGaleria
          ? 'Vídeo salvo no app e na galeria (álbum Violeta).'
          : 'Vídeo salvo no app.'
      );
    } catch (err) {
      setGravandoVideo(false);
      console.log('Erro ao gravar vídeo:', err);
      Alert.alert('Erro', 'Não foi possível gravar o vídeo.');
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
      Alert.alert('Erro', 'Não foi possível reproduzir. O arquivo pode ter sido movido.');
    }
  }

  async function compartilhar(uri, tipo) {
    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert('Indisponível', 'Compartilhamento não disponível neste dispositivo.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: tipo === 'audio' ? 'audio/m4a' : 'video/mp4',
        dialogTitle: 'Compartilhar evidência - Violeta',
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível compartilhar o arquivo.');
    }
  }

  async function excluir(id) {
    Alert.alert('Excluir gravação', 'Tem certeza? Esta ação não pode ser desfeita.', [
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
      <Text style={styles.titulo}>Gravação Discreta</Text>

      <View style={styles.seletor}>
        <TouchableOpacity
          style={[styles.botaoModo, modo === 'audio' && styles.modoAtivo]}
          onPress={() => setModo('audio')}
        >
          <Text style={[styles.textoModo, modo === 'audio' && styles.textoModoAtivo]}>
            🎙️ Áudio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botaoModo, modo === 'video' && styles.modoAtivo]}
          onPress={() => setModo('video')}
        >
          <Text style={[styles.textoModo, modo === 'video' && styles.textoModoAtivo]}>
            📹 Vídeo
          </Text>
        </TouchableOpacity>
      </View>

      {modo === 'audio' ? (
        <View style={styles.secaoGravacao}>
          <Text style={styles.aviso}>
            {gravandoAudio
              ? '🔴 Gravando... funciona com a tela bloqueada'
              : 'Áudio gravado e salvo automaticamente'}
          </Text>
          <TouchableOpacity
            style={[styles.botaoGravar, gravandoAudio && styles.botaoParar]}
            onPress={gravandoAudio ? pararAudio : iniciarAudio}
          >
            <Text style={styles.textoBotaoGravar}>
              {gravandoAudio ? '⏹  Parar Gravação' : '⏺  Iniciar Gravação de Áudio'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.secaoGravacao}>
          <Text style={styles.aviso}>
            {gravandoVideo ? '🔴 Gravando vídeo...' : 'Vídeo salvo automaticamente na galeria'}
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
              <Text style={styles.textoBotaoGravar}>Permitir acesso à câmera</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.botaoGravar, gravandoVideo && styles.botaoParar]}
            onPress={gravandoVideo ? pararVideo : iniciarVideo}
          >
            <Text style={styles.textoBotaoGravar}>
              {gravandoVideo ? '⏹  Parar Vídeo' : '⏺  Iniciar Gravação de Vídeo'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.secao}>{registros.length} gravação(ões) salva(s)</Text>

      <FlatList
        data={registros}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTipo}>
                {item.tipo === 'audio' ? '🎙️ Áudio' : '📹 Vídeo'}
              </Text>
              <Text style={styles.cardData}>{item.data}</Text>
            </View>
            <View style={styles.cardAcoes}>
              {item.tipo === 'audio' && (
                <TouchableOpacity style={styles.botaoAcao} onPress={() => reproduzirAudio(item.uri)}>
                  <Text style={styles.iconeAcao}>▶</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.botaoAcao} onPress={() => compartilhar(item.uri, item.tipo)}>
                <Text style={styles.iconeAcao}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoAcao} onPress={() => excluir(item.id)}>
                <Text style={styles.iconeAcao}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioIcone}>🎙️</Text>
            <Text style={styles.vazioTexto}>Nenhuma gravação ainda.</Text>
            <Text style={styles.vazioSub}>As gravações ficam salvas aqui e na galeria.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF0F5', padding: 20 },
  titulo: { color: '#C06090', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  seletor: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#F5D5E8', borderRadius: 10, padding: 4 },
  botaoModo: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  modoAtivo: { backgroundColor: '#C06090' },
  textoModo: { color: '#A080B0', fontWeight: 'bold', fontSize: 15 },
  textoModoAtivo: { color: '#fff' },
  secaoGravacao: { marginBottom: 20 },
  aviso: { color: '#A080B0', fontSize: 13, marginBottom: 12, fontStyle: 'italic', textAlign: 'center' },
  camera: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  botaoGravar: { backgroundColor: '#C06090', padding: 16, borderRadius: 12, alignItems: 'center' },
  botaoParar: { backgroundColor: '#c62828' },
  botaoPermissao: { backgroundColor: '#E8C0D8', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  textoBotaoGravar: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secao: { color: '#C06090', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14, borderRadius: 10,
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: '#C06090',
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  cardTipo: { color: '#6D3B5E', fontWeight: 'bold', fontSize: 14 },
  cardData: { color: '#A080B0', fontSize: 12, marginTop: 2 },
  cardAcoes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botaoAcao: { padding: 8 },
  iconeAcao: { fontSize: 20 },
  vazio: { alignItems: 'center', marginTop: 30 },
  vazioIcone: { fontSize: 40, marginBottom: 8 },
  vazioTexto: { color: '#A080B0', fontSize: 15 },
  vazioSub: { color: '#C4A0BA', fontSize: 13, marginTop: 4, textAlign: 'center' },
});
