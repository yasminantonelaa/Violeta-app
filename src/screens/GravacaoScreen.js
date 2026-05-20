//  -- Tela de gravação discreta de evidências --
//
//  Está é a tela mais complexa do aplicativo, pois gerencia dois tipos e mídia (áudio e vídeo),
//  múltiplas permissões do sistema operacional, reprodução de áudio e compartilhamento de arquivos
//
//  Funcionalidades:
//    - Gravação de áudio em segundo plano 
//    - Gravação de vídeo com duração máxima de 2 minutos
//    - Salvamento automático na galeria do dispositivo
//    - Histórico persistido de todas as gravações
//    - Reprodução de áudios gravados diretamente no app
//    - Compartilhamento de arquivos via apps do dospositivo
//    - Exclusão individual de gravações com confirmação 
//
//  Permissões necessárias:
//    - microfone (áudio e vídeo)
//    - câmera (vídeo)
//    - biblioteca de mídia/galeria (salvar arquivo)

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
  //  Estados que controlam a interface e o comportamento da tela:
  const [modo, setModo] = useState('audio');                    //  qual aba está ativa: 'áudio' ou 'vídeo'
  const [gravandoAudio, setGravandoAudio] = useState(false);    //  true enquanto o microfone está captando áudio 
  const [gravandoVideo, setGravandoVideo] = useState(false);    //  true enquanto a câmera está gravando 
  const [gravacao, setGravacao] = useState(null);               //  objeto da gravação de áudio em andamento
  const [registros, setRegistros] = useState([]);               //  array com o histórico de todas as gravações salvas 
  const [reproducao, setReproducao] = useState(null);           //  objeto do som sendo reproduzido no momento 

  //  Estados de permissão (retornados pelos hooks do expo-camera):
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();       //  estado e função de solicitação da câmera 
  const [micPermission, requestMicPermission] = useMicrophonePermissions();         //  estado e função do microfone
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();  //  estado e função da galeria

  //  useRef guarda uma referêcia direta ao componente CameraView na tela
  //  Diferente do useState, atualizar um ref NÃO causa re-renderização - ele é apenas um ponteiro para o elemento
  //  Ele é necessário para chamar métodos diretamente na câmera, como .recordAsync() e stopRecording()
  const cameraRef = useRef(null);

  useEffect(() => {
    configurarAudio();
    carregarRegistros();
    pedirPermissaoGaleria();
    return () => { if (reproducao) reproducao.unloadAsync(); };
  }, []);

  //  Solicita permissão de acesso à galeria de fotos/vídeos 
  //  Se negadada, avisa a usária que as gravações ainda serão salvas dentro
  //  do app, mas não aparecerão na galeria do dispositivo
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

  //  Configura o modo de áudio do dispositivo para gravação
  async function configurarAudio() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,        //  - habilita o modo de gravação no iOS
      staysActiveInBackground: true,   //  - mantém a gravação funcionando mesmo quando a tela é bloqueada
                                       //    ou outro app vem para o primeiro plano
      playsInSilentModeIOS: true,      //  - garante que o áudio não seja silenciado pelo botão de silencioso do iPhone
    });
  }

  //  Carrega o histórico de gravações do AsyncStorage 
  //  O try/catch vazio garante que um possível dado corrompido não trave a tela
  async function carregarRegistros() {
    try {
      const dados = await AsyncStorage.getItem('@gravacoes');
      if (dados) setRegistros(JSON.parse(dados));
    } catch (e) {}
  }

  //  Salva a lista completa de gravações no AsyncStorage 
  //  Chamada sempre que um item é adicionado ou removido para manter
  //  o banco local sincronizado com o estado da tela
  async function salvarRegistros(lista) {
    await AsyncStorage.setItem('@gravacoes', JSON.stringify(lista));
  }

  //  Salva um arquivo de mídia na galeria do dispoositivo
  async function salvarNaGaleria(uri) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sem permissão', 'Permissão de galeria negada. O arquivo foi salvo apenas no app.');
        return false;
      }
      const asset = await MediaLibrary.createAssetAsync(uri);         //  - cria um "asset" (ativo de mídia) na galeria 
      await MediaLibrary.createAlbumAsync('Violeta', asset, false);   //  - agrupa o asset no álbum 'Violeta'
                                                                      //    se não existir, ele é criado automaticamente 
      return true;    //  retorna true se o salvamento funcionou, false se houver erro
    } catch (e) {
      console.log('Erro ao salvar na galeria:', e);
      return false;
    }
  }

  //  Inicia a gravação de áudio com qualidade máxima
  async function iniciarAudio() {
    try {
      //  reaplica a configuração para garantir que o modo de gravação está ativo
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(  //  é a API do expo-av que abre o microfone e começa a capturar o áudio
        Audio.RecordingOptionsPresets.HIGH_QUALITY   //  usa o codec AAC no formato .m4a, que oferece boa qualidade com arquivo pequeno
      );
      setGravacao(recording);  //  grava a referência para o uso em pararAudio()
      setGravandoAudio(true);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação de áudio.');
    }
  }
  //  Encerra a garvação de áudio e salva o arquivo
  async function pararAudio() {
    if (!gravacao) return;    //  não faz nada se não há gravação ativa
    try {
      await gravacao.stopAndUnloadAsync();    //  stopAndUnloadAsync - encerra a captura e libera o microfone 
      const uri = gravacao.getURI();          //  getURI() - obtém o caminho temporário do arquivo gravado

      const salvouNaGaleria = await salvarNaGaleria(uri);   //  salvarNaGaleria - copia para a galeria permanente do dispoositivo

      //  Cria o objeto de registro com metadados para exibir no histórico 
      const novo = {
        id: Date.now().toString(),
        tipo: 'audio',
        uri,
        data: new Date().toLocaleString('pt-BR'),   //  formata como "dd/mm/ano, hr:min:sec"
      };

      //  Usa spread com o novo item na frente para exibir o mais recente primeiro 
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

  //  Inicia a gravação de vídeo após verificar todas as permissões necessárias 
  async function iniciarVideo() {
    //  Verifica e solicita permissão da câmera se necessário
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para gravar vídeo.');
        return;
      }
    }
    //  Verifica e solicita permissão do microfone se necessário 
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso ao microfone para gravar vídeo.');
        return;
      }
    }
    //  Verifica se o componente da câmera está montado e acessível
    if (!cameraRef.current) {
      Alert.alert('Erro', 'Câmera não está pronta. Aguarde um momento.');
      return;
    }
    try {
      setGravandoVideo(true);
      //  recordAsync é uma Promise que só resolve quando a gravação para
      //  Ela fica "esperando" até que pararVideo() chame stopRecording 
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });  //  120 limita o vídeo a 2 minutos

      //  Se o vídeo for cancelado sem gravar nada, uri pode ser underfined
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

  //  Para a gravação de vídeo em andamento
  async function pararVideo() {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();  //  stopRecording() sinaliza para a câmera encerrar
                                                //  isso faz a Promise de recordAsync() em iniciarVideo() resolver com o arquivo gravado
    }
  }

  //  Reproduz um áudio gravado diretamente no app
  //
  //  Antes de reproduzir, dois passos importantes:
  //    1. Se já houver um som sendo reproduzido, ele é descarregado da memória 
  //       com unloadAsync() para liberar recursos antes de carregar o próximo.
  //    2. O modo de áudio é trocado de 'gravação' para 'reprodução' com 
  //       allowsRecordingIOS: false — sem isso, o som poderia não tocar
  //       corretamente no iOS após ter sido usado para gravar.
  async function reproduzirAudio(uri) {
    try {
      if (reproducao) await reproducao.unloadAsync();  //  libera o áudio anterior

      //  Muda para o modo de reprodução (edsabilita gravação)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound } = await Audio.Sound.createAsync({ uri });
      setReproducao(sound);  //  guarda referência para liberar na desmontagem
      await sound.playAsync();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível reproduzir. O arquivo pode ter sido movido.');
    }
  }

  //  Compartilha um arquivo de mídia via apps externos do dispositivo 
  //  O expo-sharing abre o painel nativo de compartilhamento do sistema, permitindo enviar a evidência por WhatsApp, e-mail, Drive, etc
  //  O mimeType informa ao sistema o formato do arquivo para que ele saiba quais apps são compatíveis para receber o compartilhamento
  async function compartilhar(uri, tipo) {  //  uri - caminho do arquivo; tipo - 'áudio' ou 'vídeo'
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

  //  Exclui uma gravação do histórico após confirmação
  //  Usa .filter() para criar uma nova lista sem o item removido, mantendo o princípio de imutabilidade dp React
  async function excluir(id) {  //  id - id único da gravação a ser excluída
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

      {/* Seletor de modo: dois botões que alternam entre 'audio' e 'video'.
          O estilo condicional aplica modoAtivo apenas no botão selecionado,
          criando o efeito visual de "aba selecionada" */}
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

      {/* Renderização condicional baseada no modo selecionado.
          Operador ternário: se modo === 'audio', exibe a seção de áudio;
          caso contrário, exibe a seção de vídeo com o preview da câmera */}
      {modo === 'audio' ? (
        <View style={styles.secaoGravacao}>
          {/* Aviso dinâmico: muda de texto conforme o estado da gravação */}
          <Text style={styles.aviso}>
            {gravandoAudio
              ? '🔴 Gravando... funciona com a tela bloqueada'
              : 'Áudio gravado e salvo automaticamente'}
          </Text>
          {/* Botão duplo: o mesmo botão inicia E para a gravação.
              O estilo e o texto mudam conforme gravandoAudio para
              deixar o estado atual sempre claro para a usuária */}
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
          {/* O preview da câmera só é exibido se a permissão foi concedida.
              Caso contrário, um botão de solicitação de permissão aparece no lugar.
              Isso evita um crash que ocorreria se tentássemos renderizar
              CameraView sem a permissão ter sido concedida */}
          {cameraPermission?.granted ? (
            <CameraView
              ref={cameraRef}  //  conecta o ref ao componente para acessar seus métodos
              style={styles.camera}
              mode="video"
              facing="back"  //  usa a câmera traseira por padrão
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

      {/* Contador atualizado automaticamente conforme gravações são adicionadas/removidas */}
      <Text style={styles.secao}>{registros.length} gravação(ões) salva(s)</Text>

      {/* FlatList renderiza o histórico de gravações de forma performática.
          Cada item exibe: tipo (áudio/vídeo), data e três botões de ação.
          O botão de play só aparece para áudios, pois vídeos precisam
          de um player externo e são acessados via Compartilhamento */}
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
              {/* Botão de play: exibido apenas para gravações de áudio */}
              {item.tipo === 'audio' && (
                <TouchableOpacity style={styles.botaoAcao} onPress={() => reproduzirAudio(item.uri)}>
                  <Text style={styles.iconeAcao}>▶</Text>
                </TouchableOpacity>
              )}
              {/* Botão de compartilhar: abre o painel de compartilhamento do SO */}
              <TouchableOpacity style={styles.botaoAcao} onPress={() => compartilhar(item.uri, item.tipo)}>
                <Text style={styles.iconeAcao}>📤</Text>
              </TouchableOpacity>
              {/* Botão de excluir: pede confirmação antes de remover */}
              <TouchableOpacity style={styles.botaoAcao} onPress={() => excluir(item.id)}>
                <Text style={styles.iconeAcao}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Exibido automaticamente quando não há nenhuma gravação salva */}    
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

//  -- Estilos --
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FDF0F5', 
    padding: 20 
  },
  titulo: {
    color: '#C06090', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  seletor: { 
    flexDirection: 'row',
    marginBottom: 16, 
    backgroundColor: '#F5D5E8', 
    borderRadius: 10, 
    padding: 4 
  },
  botaoModo: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  modoAtivo: { 
    backgroundColor: '#C06090' 
  },
  textoModo: { 
    color: '#A080B0', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  textoModoAtivo: { 
    color: '#fff' 
  },
  secaoGravacao: { 
    marginBottom: 20 
  },
  aviso: { 
    color: '#A080B0', 
    fontSize: 13, 
    marginBottom: 12, 
    fontStyle: 'italic', 
    textAlign: 'center' 
  },
  camera: { 
    width: '100%', 
    height: 180, 
    borderRadius: 12, 
    marginBottom: 12, 
    overflow: 'hidden'  //  garante que o vídeo respeite o borderRadius 
  },
  botaoGravar: { 
    backgroundColor: '#C06090', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  botaoParar: { 
    backgroundColor: '#c62828'
  },
  botaoPermissao: { 
    backgroundColor: '#E8C0D8', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  textoBotaoGravar: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
    },
  secao: { 
    color: '#C06090', 
    fontSize: 14, 
    fontWeight: 'bold',
    marginBottom: 10
  },
  card: {
    backgroundColor: '#fff',
    padding: 14, borderRadius: 10,
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: '#C06090',
    elevation: 2,
  },
  cardInfo: { 
    flex: 1 
  },
  cardTipo: { 
    color: '#6D3B5E', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  cardData: { 
    color: '#A080B0', 
    fontSize: 12, 
    marginTop: 2 
  },
  cardAcoes: { 
    flexDirection: 'row',  
    alignItems: 'center',
    gap: 4 
  },
  botaoAcao: { 
    padding: 8 
  },
  iconeAcao: {
    fontSize: 20
  },
  vazio: {
    alignItems: 'center',
    marginTop: 30
  },
  vazioIcone: { 
    fontSize: 40, 
    marginBottom: 8 
  },
  vazioTexto: { 
    color: '#A080B0', 
    fontSize: 15 
  },
  vazioSub: { 
    color: '#C4A0BA', 
    fontSize: 13, 
    marginTop: 4, 
    textAlign: 'center' 
  },
});
