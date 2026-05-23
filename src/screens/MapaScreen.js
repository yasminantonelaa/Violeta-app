//  -- Tela de mapa de pontos de risco --
//
//  Exibe pontos de risco no campus em um mapa interativo compartilhado entre todas as usuárias
//  Os pontos são armazenados na API JSONBin e carregados em tempo real
//
//  Funcionalidades:
//    - Visualização dos pontos de risco no mapa com marcadores coloridos por nível
//    - Vista alternativa em lista com filtro por nível
//    - Reporte de novos pontos tocando no mapa
//    - Detalhe de cada ponto com informações completas
//    - Remoção de pontos reportados incorretamente
//    - Geocodificação reversa: preenche bairro/cidade automaticamente
 
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, ActivityIndicator, FlatList, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

// -- Configuração da API JSONBin --
// BIN_ID e ACCESS_KEY identificam o banco de dados remoto onde os pontos são salvos
const BIN_ID = '6a0e3a496877513b27a6c929';
const ACCESS_KEY = '$2a$10$vNFKR5umat32ZeDqSKeI5.NtJwt20vGDu20GBRZz6YwqyhUSthdGi';
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Três níveis de periculosidade com cor associada para os marcadores e badges
const NIVEIS = [
  { label: 'Baixo', valor: 'baixo', cor: '#4CAF50' },
  { label: 'Médio', valor: 'medio', cor: '#FFC107' },
  { label: 'Alto', valor: 'alto', cor: '#F44336' },
];

// Faixas de horário disponíveis para seleção no reporte de ponto
const HORARIOS = [
  'Manhã (6h–12h)',
  'Tarde (12h–18h)',
  'Noite (18h–22h)',
  'Madrugada (22h–6h)',
];

export default function MapaScreen() {
  const [localizacao, setLocalizacao] = useState(null);         // coordenadas do usuário
  const [pontos, setPontos] = useState([]);                     //  lista de pontos carregados da API
  const [carregando, setCarregando] = useState(true);           //  exibe o spinner enquanto carrega
  const [modalVisivel, setModalVisivel] = useState(false);      //  exibe o spinner enquanto carrega
  const [vistaAtual, setVistaAtual] = useState('mapa');         //  'mapa' ou 'lista'
  const [coordSelecionada, setCoordSelecionada] = useState(null);
  const [nomePonto, setNomePonto] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nivelSelecionado, setNivelSelecionado] = useState(null);
  const [horariosSelecionados, setHorariosSelecionados] = useState([]);
  const [adicionando, setAdicionando] = useState(false);        //  true = modo de toque no mapa ativo
  const [salvando, setSalvando] = useState(false);              //  true durante o envio para a API
  const [pontoDetalhe, setPontoDetalhe] = useState(null);       //  ponto selecionado para detalhes

  //  useRef para o MapView: permite chamar animateToRegion() diretamente no mapa
  const mapaRef = useRef(null);

    // escalaReportar: animação de escala no botão "Reportar Ponto de Risco"
  const escalaReportar = useRef(new Animated.Value(1)).current;
 
  // Anima a escala de um botão: comprime ao pressionar e volta ao soltar
  function animarBotao(escala, callback) {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }
 
  //  Na montagem, busca localização e carrega os pontos da API em paralelo
  useEffect(() => {
    pedirLocalizacao();
    carregarPontos();
  }, []);

  //  Solicita permissão de localização e preenche bairro/cidade via geocodificação reversa
  async function pedirLocalizacao() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: Number(loc.coords.latitude),
        longitude: Number(loc.coords.longitude),
      };
      setLocalizacao(coords);

      // Geocodificação reversa para preencher bairro/cidade automaticamente
      try {
        const endereco = await Location.reverseGeocodeAsync(coords);
        if (endereco[0]) {
          setBairro(endereco[0].district || endereco[0].subregion || '');
          setCidade(endereco[0].city || endereco[0].region || '');
        }
      } catch (e) {}
    }
  }

  //  Carrega os pontos de risco da API JSONBin
  async function carregarPontos() {
    try {
      const res = await fetch(URL, {
        headers: { 'X-Master-Key': ACCESS_KEY },
      });
      const data = await res.json();
      setPontos(data.record?.pontos || []);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os pontos. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  }

  //  Salva a lista completa de pontos na API (substitui o registro inteiro)
  async function salvarPontosNaAPI(lista) {
    await fetch(URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': ACCESS_KEY,
      },
      body: JSON.stringify({ pontos: lista }),
    });
  }

  //  Captura o toque no mapa quando o modo "adicionando" está ativo
  async function tocarMapa(evento) {
    if (!adicionando) return;
    const { coordinate } = evento.nativeEvent;
    const coords = {
      latitude: Number(coordinate.latitude),
      longitude: Number(coordinate.longitude),
    };
    setCoordSelecionada(coords);

    // Geocodificação reversa ao tocar no mapa
    try {
      const endereco = await Location.reverseGeocodeAsync(coords);
      if (endereco[0]) {
        setBairro(endereco[0].district || endereco[0].subregion || '');
        setCidade(endereco[0].city || endereco[0].region || '');
      }
    } catch (e) {}

    setModalVisivel(true);
    setAdicionando(false);
  }

  //  Alterna um horário na lista de selecionados: adiciona se não está, remove se já está  
  function toggleHorario(h) {
    setHorariosSelecionados(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  }

  //  Valida o formulário, salva o novo ponto na API e atualiza o estado local
  async function confirmarPonto() {
    if (!nomePonto.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do local.');
      return;
    }
    if (!bairro.trim() || !cidade.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o bairro e a cidade.');
      return;
    }
    if (!nivelSelecionado) {
      Alert.alert('Campo obrigatório', 'Selecione o nível de periculosidade.');
      return;
    }
    if (horariosSelecionados.length === 0) {
      Alert.alert('Campo obrigatório', 'Selecione pelo menos um horário de risco.');
      return;
    }

    setSalvando(true);
    try {
      const novo = {
        id: Date.now().toString(),
        latitude: coordSelecionada.latitude,
        longitude: coordSelecionada.longitude,
        nome: nomePonto.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        descricao: descricao.trim(),
        nivel: nivelSelecionado,
        horarios: horariosSelecionados,
        data: new Date().toLocaleDateString('pt-BR'),
      };

      const lista = [...pontos, novo];
      await salvarPontosNaAPI(lista);
      setPontos(lista);
      fecharModal();
      Alert.alert('Ponto adicionado!', 'O ponto de risco foi salvo e já está visível para todas as usuárias.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvando(false);
    }
  }

  //  Remove um ponto da API e do estado local após confirmação
  async function removerPonto(id) {
    Alert.alert('Remover ponto', 'Deseja remover este ponto de risco?', [
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const lista = pontos.filter(p => p.id !== id);
          await salvarPontosNaAPI(lista);
          setPontos(lista);
          setPontoDetalhe(null);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  //  Limpa todos os campos e fecha o modal de reporte
  function fecharModal() {
    setModalVisivel(false);
    setNomePonto('');
    setDescricao('');
    setNivelSelecionado(null);
    setHorariosSelecionados([]);
    setCoordSelecionada(null);
  }

  //  Retorna a cor correspondente ao nível de periculosidade do ponto
  function corDoNivel(nivel) {
    return NIVEIS.find(n => n.valor === nivel)?.cor || '#9C27B0';
  }

  //  Anima o mapa para centralizar na localização atual da usuária
  function irParaMinhaLocalizacao() {
    if (localizacao && mapaRef.current) {
      mapaRef.current.animateToRegion({
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }

  //  Formata coordenadas decimais em graus com direção cardinal (N/S/L/O)
  function formatarCoordenadas(lat, lng) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'L' : 'O';
    return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
  }

  //  Região inicial do mapa: usa localização do usuário se disponível,
  //  senão centra no Piauí (sede do projeto)
  const regiaoInicial = localizacao
    ? { latitude: localizacao.latitude, longitude: localizacao.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: -5.0920, longitude: -42.8016, latitudeDelta: 0.015, longitudeDelta: 0.015 };

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C06090" />
        <Text style={styles.loadingTexto}>Carregando pontos de risco...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Seletor de vista */}
      <View style={styles.seletor}>
        <TouchableOpacity
          style={[styles.botaoVista, vistaAtual === 'mapa' && styles.vistaAtiva]}
          onPress={() => setVistaAtual('mapa')}
        >
          <Ionicons
            name={vistaAtual === 'mapa' ? 'map' : 'map-outline'}
            size={16}
            color={vistaAtual === 'mapa' ? '#fff' : '#AB92BF'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.textoVista, vistaAtual === 'mapa' && styles.textoVistaAtivo]}>
            Mapa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botaoVista, vistaAtual === 'lista' && styles.vistaAtiva]}
          onPress={() => setVistaAtual('lista')}
        >
          <Ionicons
            name={vistaAtual === 'lista' ? 'list' : 'list-outline'}
            size={16}
            color={vistaAtual === 'lista' ? '#fff' : '#AB92BF'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.textoVista, vistaAtual === 'lista' && styles.textoVistaAtivo]}>
            Lista ({pontos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {vistaAtual === 'mapa' ? (
        <>
          <MapView
            ref={mapaRef}
            style={styles.mapa}
            initialRegion={regiaoInicial}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onPress={tocarMapa}
          >
            {pontos.map(p => (
              <Marker
                key={p.id}
                coordinate={{ latitude: Number(p.latitude), longitude: Number(p.longitude) }}
                pinColor={corDoNivel(p.nivel)}
                onPress={() => setPontoDetalhe(p)}
              />
            ))}
          </MapView>

          {/* Botões flutuantes */}
          <View style={styles.botoesFlutantes}>
            <TouchableOpacity style={styles.botaoFlutante} onPress={irParaMinhaLocalizacao}>
              <Ionicons name="locate-outline" size={22} color="#564787" />            
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoFlutante} onPress={carregarPontos}>
              <Ionicons name="refresh-outline" size={22} color="#564787" />
            </TouchableOpacity>
          </View>

          {/* Rodapé do mapa */}
          <View style={styles.rodape}>
            {localizacao && (
              <Text style={styles.coordenadasTexto}>
                {formatarCoordenadas(localizacao.latitude, localizacao.longitude)}
              </Text>
            )}
            <Animated.View style={{ transform: [{ scale: escalaReportar }] }}>
              <TouchableOpacity
                style={[styles.botaoAdicionar, adicionando && styles.botaoAdicionandoAtivo]}
                onPress={() => animarBotao(escalaReportar, () => {
                  setAdicionando(!adicionando);
                  if (!adicionando) Alert.alert('Modo ativo', 'Toque no mapa para marcar um ponto de risco.');
                })}
              >
              <Ionicons
                  name={adicionando ? 'close-outline' : 'warning-outline'}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.textoBotaoAdicionar}>
                  {adicionando ? 'Cancelar' : 'Reportar Ponto de Risco'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Modal de detalhe do ponto */}
          {pontoDetalhe && (
            <Modal visible={true} transparent animationType="slide">
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setPontoDetalhe(null)}>
                <View style={styles.detalheContainer}>
                  <View style={[styles.detalheNivelBarra, { backgroundColor: corDoNivel(pontoDetalhe.nivel) }]} />
                  <Text style={styles.detalheTitulo}>{pontoDetalhe.nome}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="location-outline" size={14} color="#AB92BF" style={{ marginRight: 4 }} />
                    <Text style={styles.detalheEndereco}>
                      {pontoDetalhe.bairro}{pontoDetalhe.cidade ? `, ${pontoDetalhe.cidade}` : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="globe-outline" size={14} color="#655A7C" style={{ marginRight: 4 }} />
                    <Text style={styles.detalheCoordenadas}>
                      {formatarCoordenadas(pontoDetalhe.latitude, pontoDetalhe.longitude)}
                    </Text>
                  </View>
                  {pontoDetalhe.descricao ? (
                    <Text style={styles.detalheDesc}>{pontoDetalhe.descricao}</Text>
                  ) : null}
                  <Text style={[styles.detalheNivel, { color: corDoNivel(pontoDetalhe.nivel) }]}>
                    {NIVEIS.find(n => n.valor === pontoDetalhe.nivel)?.label}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="time-outline" size={14} color="#DBCBD8" style={{ marginRight: 4 }} />
                    <Text style={styles.detalheHorariosLabel}>Horários de risco:</Text>
                  </View>
                  <View style={styles.horariosChips}>
                    {(pontoDetalhe.horarios || [pontoDetalhe.horario]).map(h => (
                      <View key={h} style={styles.chip}>
                        <Text style={styles.chipTexto}>{h}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.detalheData}>Reportado em {pontoDetalhe.data}</Text>
                  <TouchableOpacity
                    style={styles.botaoRemoverDetalhe}
                    onPress={() => removerPonto(pontoDetalhe.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#F44336" style={{ marginRight: 6 }} />
                    <Text style={styles.textoRemoverDetalhe}>Remover este ponto</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </>
      ) : (
        // VISTA DE LISTA
        <FlatList
          data={pontos}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listaPadding}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="location-outline" size={52} color="#3D3468" style={{ marginBottom: 12 }} />       
              <Text style={styles.vazioTexto}>Nenhum ponto registrado ainda.</Text>
              <Text style={styles.vazioSub}>Vá para o mapa e reporte pontos de risco.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardLista}
              onPress={() => { setVistaAtual('mapa'); setPontoDetalhe(item); }}
            >
              <View style={[styles.cardNivelBarra, { backgroundColor: corDoNivel(item.nivel) }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="location-outline" size={12} color="#AB92BF" style={{ marginRight: 4 }} />
                  <Text style={styles.cardEndereco}>
                    {item.bairro}{item.cidade ? `, ${item.cidade}` : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="globe-outline" size={12} color="#655A7C" style={{ marginRight: 4 }} />
                  <Text style={styles.cardCoordenadas}>
                    {formatarCoordenadas(item.latitude, item.longitude)}
                  </Text>
                </View>
                <View style={styles.horariosChips}>
                  {(item.horarios || [item.horario]).map(h => (
                    <View key={h} style={styles.chip}>
                      <Text style={styles.chipTexto}>{h}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.cardRodape}>
                  <Text style={[styles.cardNivel, { color: corDoNivel(item.nivel) }]}>
                    {NIVEIS.find(n => n.valor === item.nivel)?.label}
                  </Text>
                  <Text style={styles.cardData}>{item.data}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de adicionar ponto */}
      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="warning-outline" size={22} color="#564787" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitulo}>Novo Ponto de Risco</Text>
            </View>
            <Text style={styles.modalSubtitulo}>
              Este ponto ficará visível para todas as usuárias do Violeta.
            </Text>

            {coordSelecionada && (
              <View style={styles.coordBox}>
                <Ionicons name="globe-outline" size={14} color="#AB92BF" style={{ marginRight: 6 }} />
                <Text style={styles.coordBoxTexto}>
                  {formatarCoordenadas(coordSelecionada.latitude, coordSelecionada.longitude)}
                </Text>
              </View>
            )}

            <Text style={styles.modalLabel}>Nome do local *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Estacionamento Sul, Corredor Bloco B..."
              placeholderTextColor="#655A7C"
              value={nomePonto}
              onChangeText={setNomePonto}
            />

            <Text style={styles.modalLabel}>Bairro *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do bairro"
              placeholderTextColor="#655A7C"
              value={bairro}
              onChangeText={setBairro}
            />

            <Text style={styles.modalLabel}>Cidade *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome da cidade"
              placeholderTextColor="#655A7C"
              value={cidade}
              onChangeText={setCidade}
            />

            <Text style={styles.modalLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Descreva o problema neste local..."
              placeholderTextColor="#655A7C"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Nível de periculosidade *</Text>
            <View style={styles.opcoes}>
              {NIVEIS.map(n => (
                <TouchableOpacity
                  key={n.valor}
                  style={[styles.opcao, nivelSelecionado === n.valor && { borderColor: n.cor, backgroundColor: n.cor + '22' }]}
                  onPress={() => setNivelSelecionado(n.valor)}
                >
                  <Text style={[styles.textoOpcao, nivelSelecionado === n.valor && { color: n.cor, fontWeight: 'bold' }]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Horários de risco * (selecione todos que se aplicam)</Text>
            <View style={styles.opcoes}>
              {HORARIOS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.opcao, horariosSelecionados.includes(h) && styles.opcaoSelecionada]}
                  onPress={() => toggleHorario(h)}
                >
                  <Text style={[styles.textoOpcao, horariosSelecionados.includes(h) && styles.textoOpcaoSelecionada]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.modalBotaoCancelar} onPress={fecharModal}>
                <Text style={styles.modalTextoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBotaoConfirmar, salvando && { opacity: 0.7 }]}
                onPress={confirmarPonto}
                disabled={salvando}
              >
                {salvando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalTextoConfirmar}>Salvar Ponto</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

//  -- Estilos --
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1A2E' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1A2E' },
  loadingTexto: { color: '#DBCBD8', marginTop: 12, fontSize: 15 },
  seletor: {
    flexDirection: 'row',
    backgroundColor: '#2D2450',
    padding: 4, margin: 12,
    borderRadius: 12,
  },
  botaoVista: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  vistaAtiva: { backgroundColor: '#564787' },
  textoVista: { color: '#AB92BF', fontWeight: 'bold', fontSize: 14 },
  textoVistaAtivo: { color: '#fff' },
  mapa: { flex: 1 },
  botoesFlutantes: { position: 'absolute', right: 16, top: 80, gap: 10 },
  botaoFlutante: {
    backgroundColor: '#2D2450', width: 48, height: 48,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    borderWidth: 1, borderColor: '#3D3468',
  },
  rodape: { backgroundColor: '#2D2450', padding: 14, borderTopWidth: 1, borderTopColor: '#3D3468' },
  coordenadasTexto: { color: '#AB92BF', fontSize: 11, textAlign: 'center', marginBottom: 8 },
  botaoAdicionar: { backgroundColor: '#564787', padding: 14, borderRadius: 12, alignItems: 'center' },
  botaoAdicionandoAtivo: { backgroundColor: '#655A7C' },
  textoBotaoAdicionar: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  listaPadding: { padding: 12 },
  cardLista: {
    backgroundColor: '#2D2450', borderRadius: 14,
    marginBottom: 12, flexDirection: 'row',
    elevation: 2, overflow: 'hidden',
    borderWidth: 1, borderColor: '#3D3468',
  },
  cardNivelBarra: { width: 6 },
  cardBody: { flex: 1, padding: 14 },
  cardNome: { fontWeight: 'bold', fontSize: 15, color: '#F2FDFF', marginBottom: 4 },
  cardEndereco: { fontSize: 13, color: '#AB92BF', marginBottom: 2 },
  cardCoordenadas: { fontSize: 11, color: '#655A7C', marginBottom: 8 },
  cardRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardNivel: { fontWeight: 'bold', fontSize: 13 },
  cardData: { fontSize: 11, color: '#655A7C' },
  horariosChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { backgroundColor: '#3D3468', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#564787' },
  chipTexto: { fontSize: 11, color: '#AB92BF' },
  vazio: { alignItems: 'center', marginTop: 60 },
  vazioIcone: { fontSize: 48, marginBottom: 12 },
  vazioTexto: { color: '#DBCBD8', fontSize: 16, marginBottom: 6 },
  vazioSub: { color: '#AB92BF', fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#2D2450', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: '#F2FDFF', marginBottom: 4 },
  modalSubtitulo: { fontSize: 12, color: '#AB92BF', marginBottom: 16 },
  coordBox: { backgroundColor: '#1E1A2E', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#3D3468' },
  coordBoxTexto: { color: '#AB92BF', fontSize: 12, textAlign: 'center' },
  modalLabel: { color: '#DBCBD8', fontWeight: 'bold', fontSize: 14, marginBottom: 8, marginTop: 12 },
  modalInput: { backgroundColor: '#1E1A2E', color: '#F2FDFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3D3468', fontSize: 14 },
  modalInputMultiline: { height: 80, textAlignVertical: 'top' },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3D3468', backgroundColor: '#1E1A2E' },
  opcaoSelecionada: { borderColor: '#564787', backgroundColor: '#2D2450' },
  textoOpcao: { color: '#AB92BF', fontSize: 13 },
  textoOpcaoSelecionada: { color: '#F2FDFF', fontWeight: 'bold' },
  modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBotaoCancelar: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#3D3468', alignItems: 'center' },
  modalTextoCancelar: { color: '#AB92BF', fontWeight: 'bold' },
  modalBotaoConfirmar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#564787', alignItems: 'center' },
  modalTextoConfirmar: { color: '#fff', fontWeight: 'bold' },
  detalheContainer: { backgroundColor: '#2D2450', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  detalheNivelBarra: { height: 4, borderRadius: 2, marginBottom: 16 },
  detalheTitulo: { fontSize: 20, fontWeight: 'bold', color: '#F2FDFF', marginBottom: 6 },
  detalheEndereco: { fontSize: 14, color: '#AB92BF', marginBottom: 4 },
  detalheCoordenadas: { fontSize: 12, color: '#655A7C', marginBottom: 8 },
  detalheDesc: { fontSize: 13, color: '#DBCBD8', marginBottom: 8 },
  detalheNivel: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  detalheHorariosLabel: { fontSize: 13, color: '#DBCBD8', fontWeight: 'bold', },
  detalheData: { fontSize: 11, color: '#655A7C', marginTop: 8, marginBottom: 16 },
  botaoRemoverDetalhe: { borderWidth: 1, borderColor: '#F44336', padding: 12, borderRadius: 10, alignItems: 'center' },
  textoRemoverDetalhe: { color: '#F44336', fontWeight: 'bold' },
});
