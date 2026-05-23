//  -- Tela de criação de conta --
//
//  Responsável por registrar uma nova usuária no dispositivo
//  O processo envlove coleta de dados, validação em múltiplas etapas e autodeclação de identidade de gênero
//  A tela recebe dois callbacks via props:
//    onCadastro - chamado após cadastro bem-sucedido; App.js avança para 'app'
//    onVoltar   - chamado ao clicar em "Já tenho conta"; volta para o login 
//
//  Todos os dados ficam salvos localmente no AsyncStorage, sem nenhum envio para servidores externos

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

//  Lista fixa de opções de identidade de gênero apresentadas no formulário
//  Definida fora do componente para não ser recriada a cada render
const GENEROS = [
  'Mulher cisgênero',
  'Mulher transgênero',
  'Não binário',
  'Gênero fluido',
  'Agênero',
  'Outro gênero correlato ao feminino',
];

export default function CadastroScreen({ onCadastro, onVoltar }) {
  const [nome, setNome] = useState('');                               //  nome completo da usuária
  const [usuario, setUsuario] = useState('');                         //  nome de usuário único
  const [senha, setSenha] = useState('');                             //  senha escolhida
  const [confirmarSenha, setConfirmarSenha] = useState('');           //  repetição da senha para confirmar que não houve erro
  const [generoSelecionado, setGeneroSelecionado] = useState(null);   //  qual opção de gênero foi escolhida (null = nenhuma)
  const [aceitouTermos, setAceitouTermos] = useState(false);          //  boolean do checkbox de autodeclaração
  const [senhaVisivel, setSenhaVisivel] = useState(false);            //  alterna entre mostrar e ocultar a senha

  // cardAnim: fade + deslize suave do card ao entrar na tela (0 → 1 em 400ms)
  const cardAnim = useRef(new Animated.Value(0)).current;
  // escalaCriar: escala do botão "Criar conta" ao ser pressionado (1 → 0.96 → 1)
  const escalaCriar = useRef(new Animated.Value(1)).current;
  // escalaVoltar: escala do botão "Já tenho conta" ao ser pressionado
  const escalaVoltar = useRef(new Animated.Value(1)).current;

  // Dispara a animação de entrada do card logo que a tela monta
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
 
  // Anima a escala de um botão: comprime levemente ao pressionar e volta ao soltar
  function animarBotao(escala, callback) {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }

  //  Função principal de cadastro
  //  
  //  A validação é feita em cascata: cada verificação usa 'return' para interroper a execução
  //  imediatamente se algo estiver errado, sem precisar de if/else aninhados
  //  
  //  A ordem das validações é intencional - das mais básicas para as mais especificas, da mesma
  //  forma que a usuária preenche o formulario de cima para baixo 
  async function cadastrar() {
    //  Verifica se todos os campos de texto foram preenchidos
    if (!nome.trim() || !usuario.trim() || !senha || !confirmarSenha) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }

    // Usuário precisa ter pelo menos 3 caracteres para ser identificável
    if (usuario.trim().length < 3) {
      Alert.alert('Usuário inválido', 'O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    // Senha muito curta é uma vulnerabilidade; mínimo de 6 caracteres
    if (senha.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Confirmação garante que a usuária não digitou a senha com erro de digitação
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }

    // A seleção de gênero é obrigatória, pois define o público-alvo do app
    if (!generoSelecionado) {
      Alert.alert('Autodeclaração necessária', 'Por favor, selecione como você se identifica.');
      return;
    }

    // O checkbox confirma que a usuária leu e concorda com a declaração
    if (!aceitouTermos) {
      Alert.alert('Confirmação necessária', 'Por favor, confirme sua autodeclaração.');
      return;
    }

    //  Verifica unicidade do nome de usuário
    //  Carrega a lista existente e procura se já existe alguém com o mesmo username
    //  A comparação ignora maiúsculas/minúsculas para evitar que "Maria" e "maria" sejam contas diferentes
    const dados = await AsyncStorage.getItem('@usuarios');
    const usuarios = dados ? JSON.parse(dados) : [];
    const existe = usuarios.find(
      u => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );
    if (existe) {
      Alert.alert('Usuário indisponível', 'Este nome de usuário já está em uso. Escolha outro.');
      return;
    }

    //  Monta o objeto da nova usuária
    //  O id usa Date.now() que retorna o timestamp atual em milissegundos
    const novoUsuario = {
      id: Date.now().toString(),
      nome: nome.trim(),
      usuario: usuario.trim(),
      senha,
      genero: generoSelecionado,
    };

    // Adiciona a nova usuária à lista e salva a sessão imediatamente    
    const lista = [...usuarios, novoUsuario];
    await AsyncStorage.setItem('@usuarios', JSON.stringify(lista));
    await AsyncStorage.setItem('@usuarioLogado', JSON.stringify(novoUsuario));

    // Exibe mensagem de boas-vindas e, ao confirmar, avança para o app
    animarBotao(escalaCriar, () => {
      Alert.alert('Bem-vinda!', `Conta criada com sucesso, ${nome.trim()}!`, [
        { text: 'Entrar', onPress: onCadastro }
      ]);
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled" // garante que botões funcionem com teclado aberto
    >
      {/* Cabeçalho com logo, nome e slogan — mesmo visual da LoginScreen */}
      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/borboleta.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appNome}>VIOLETA</Text>
        </View>
        <Text style={styles.appSlogan}>Silêncio Nunca Mais</Text>
      </View>

      {/* Card animado: desliza de baixo para cima e faz fade ao entrar na tela */}
      <Animated.View style={[
        styles.card,
        {
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            })
          }]
        }
      ]}>
        <Text style={styles.titulo}>Criar conta</Text>
 
        {/* Campo de nome completo — sem restrição de capitalização */}
        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Como você quer ser chamada?"
          placeholderTextColor="#AB92BF"
          value={nome}
          onChangeText={setNome}
        />

        {/* Nome de usuário — autoCapitalize off para não forçar maiúscula */}
        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Escolha um usuário único"
          placeholderTextColor="#AB92BF"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        {/* Campo de senha com botão de visibilidade */}
        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputSenhaContainer}>
          <TextInput
            style={styles.inputSenha}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#AB92BF"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!senhaVisivel} // true = oculta com "******"
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Ionicons name={senhaVisivel ? 'eye-off' : 'eye'} size={22} color="#DBCBD8" />
          </TouchableOpacity>
        </View>

          {/* Campo de confirmação de senha: usa a mesma visibilidade da 
              senha principal (senhaVisivel) para que ambos mostrem/escondam
              juntos, facilitando a comparação visual */}
        <Text style={styles.label}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Repita sua senha"
          placeholderTextColor="#AB92BF"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry={!senhaVisivel}
        />

        {/* Seção de autodeclaração de gênero */}
        <Text style={styles.label}>Como você se identifica?</Text>
        <Text style={styles.sublabel}>
          O Violeta é um espaço seguro para mulheres e pessoas de gêneros correlatos ao feminino.
        </Text>

        {/* .map() percorre o array GENEROS e renderiza um botão para cada opção
            O estilo condicional [ styles.opcaoGenero, generoSelecionado === genero && styles.opcaoSelecionada ]
            aplica o estilo de seleção apenas na opção que foi tocada */}
        {GENEROS.map(genero => (
          <TouchableOpacity
            key={genero}
            style={[styles.opcaoGenero, generoSelecionado === genero && styles.opcaoSelecionada]}
            onPress={() => setGeneroSelecionado(genero)}
          >
            {/* Botão de rádio customizado: círculo externo + ponto interno quando selecionado */}
            <View style={[styles.radio, generoSelecionado === genero && styles.radioSelecionado]}>
              {generoSelecionado === genero && <View style={styles.radioDentro} />}
            </View>
            <Text style={[styles.textoOpcao, generoSelecionado === genero && styles.textoOpcaoSelecionado]}>
              {genero}
            </Text>
          </TouchableOpacity>
        ))}

          {/* Checkbox de autodeclaração: ao tocar, inverte o estado booleano de aceitouTermos com !aceitouTermos
              O estilo do checkbox muda visualmente conforme o estado (desmarcado --> marcado) */}
        <TouchableOpacity
          style={styles.checkContainer}
          onPress={() => setAceitouTermos(!aceitouTermos)}
        >
          <View style={[styles.checkbox, aceitouTermos && styles.checkboxMarcado]}>
            {aceitouTermos && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.textoCheck}>
            Declaro que me identifico com a identidade de gênero selecionada e compreendo que este aplicativo é destinado a mulheres e pessoas de gêneros correlatos ao feminino.
          </Text>
        </TouchableOpacity>

        {/* Botão principal animado: só avança após todas as validações passarem */}
        <Animated.View style={{ transform: [{ scale: escalaCriar }] }}>
          <TouchableOpacity style={styles.botao} onPress={cadastrar}>
            <Text style={styles.textoBotao}>Criar conta</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Link para voltar ao login caso a usuária já tenha uma conta */}
        <Animated.View style={{ transform: [{ scale: escalaVoltar }] }}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => animarBotao(escalaVoltar, onVoltar)}
          >
            <Text style={styles.textoVoltar}>← Já tenho conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
 

      {/* Rodapé reforçando que os dados são armazenados apenas localmente */}
      <Text style={styles.rodape}>
        Seus dados ficam salvos apenas no seu dispositivo.
      </Text>
    </ScrollView>
  );
}

// -- Estilos --
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1E1A2E',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: { alignItems: 'center', marginBottom: 24, alignSelf: 'center', },
  logo: { width: 130, height: 130, marginBottom: -34, alignSelf: 'center' },
  appNome: { fontSize: 24, fontWeight: 'bold', color: '#DBCBD8', letterSpacing: 8, marginBottom: 4, textAlign: 'center', },
  appSlogan: { fontSize: 12, color: '#AB92BF', fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#2D2450',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#3D3468',
    elevation: 4,   // sombra no Android
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#F2FDFF', marginBottom: 16, textAlign: 'center' },
  label: { color: '#DBCBD8', fontWeight: 'bold', fontSize: 14, marginBottom: 6, marginTop: 12 },
  sublabel: { color: '#AB92BF', fontSize: 12, marginBottom: 10, lineHeight: 18 },
  input: {
    backgroundColor: '#1E1A2E',
    color: '#F2FDFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3468',
    fontSize: 15,
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3468',
    paddingRight: 12,
  },
  inputSenha: { flex: 1, color: '#F2FDFF', padding: 14, fontSize: 15 },
  opcaoGenero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A2E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3D3468',
  },
  opcaoSelecionada: { borderColor: '#564787', backgroundColor: '#2D2450' },
  radio: {
    width: 20, height: 20, borderRadius: 10,    // borderRadius igual a metade = círculo perfeito
    borderWidth: 2, borderColor: '#AB92BF',
    marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  radioSelecionado: { borderColor: '#564787' },
  radioDentro: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#564787' },
  textoOpcao: { color: '#AB92BF', fontSize: 14, flex: 1 },
  textoOpcaoSelecionado: { color: '#F2FDFF', fontWeight: 'bold' },
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',   // alinha pelo topo para o checkbox não centralizar com um texto longo
    marginTop: 20,
    marginBottom: 24,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#564787',
    marginRight: 12, alignItems: 'center',
    justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  checkboxMarcado: { backgroundColor: '#564787' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  textoCheck: { color: '#DBCBD8', fontSize: 12, flex: 1, lineHeight: 18 },
  botao: {
    backgroundColor: '#564787',
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botaoVoltar: { alignItems: 'center', marginTop: 16, padding: 8 },
  textoVoltar: { color: '#AB92BF', fontSize: 14 },
  rodape: { color: '#AB92BF', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
