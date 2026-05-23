//  -- Tela de autenticação --
//
//  Responsável por autenticar uma usuária já cadastrada no dispositivo
//  A tela recebe dois callbacks via props
//    onLogin - chamado quando o login é bem-sucedido 
//              App.js muda o estado para 'app' e exibe as abas principais
//    onIrCadastro - chamado quando a usuária clica em "Criar nova conta"
//                   App.js muda o estado para 'cadastro'
            
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ onLogin, onIrCadastro }) {
  
  //  Três estados controlam o formulario dessa tela
  const [usuario, setUsuario] = useState('');                //  texto digitado no campo de nome do usuário
  const [senha, setSenha] = useState('');                    //  texto digitado no campo de senha 
  const [senhaVisivel, setSenhaVisivel] = useState(false);   //  alterna esconder e mostrar a senha; começa como false para proteger a privacidade

  // -- Animações --
  // cardAnim: fade + deslize suave do card ao entrar na tela 
  const cardAnim = useRef(new Animated.Value(0)).current;
  // escalaEntrar: escala do botão "Entrar" ao ser pressionado 
  const escalaEntrar = useRef(new Animated.Value(1)).current;
  // escalaCadastro: escala do botão "Criar nova conta" ao ser pressionado
  const escalaCadastro = useRef(new Animated.Value(1)).current;
 
  // Dispara a animação de entrada do card logo que a tela monta
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
 
  // Anima a escala de um botão: comprime levemente ao pressionar e volta ao soltar
  // Reutilizada pelos dois botões principais da tela
  function animarBotao(escala, callback) {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }
   
  //  Função principal de autenticação
  //  Segue três estapas em ordem:
  //    1. Validação local: verifica se os campos estão preenchidos antes de consultar o AsyncStorage
  //       (evita operações desnecessárias e dá feedback imediato à usuária)
  //    2. Busca no banco local: carrega a lista de usuários salvos e procura um que combine com usuário E senha
  //    3. Início de sessão: salva o usário encontrado em @usuarioLogado e chama onLogin() para o App.js avançar para as abas
  async function entrar() {
    //  Etapa 1: campos obrigatórios
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha usuário e senha.');
      return;
    }

    // Etapa 2: busca a lista de usuário e procura a combinação correta
    const dados = await AsyncStorage.getItem('@usuarios');
    const usuarios = dados ? JSON.parse(dados) : [];
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
        && u.senha === senha
    );
    if (!encontrado) {
      Alert.alert('Erro', 'Usuário ou senha incorretos.');
      return;
    }

    // Etapa 3: persite a sessão e navega para o app
    animarBotao(escalaEntrar, async () => {
      await AsyncStorage.setItem('@usuarioLogado', JSON.stringify(encontrado));
      onLogin();
    });
  }

  //  Botão "Esqueceu sua senha?"
  //  Funciona em dois casos:
  //    - Se o campo de usuário estiver vazio: orienta a usuária a preenchê-lo primeiro antes de pedir ajuda
  //    - se o usuário for encontrado: exibe uma mensagem dizendo que a senha foi definida no cadastro
  //    A mensagem não revela a senha, apenas confirma que a conta existe e sugere recriar o cadastro como último recurso
  async function esqueceuSenha() {
    if (!usuario.trim()) {
      Alert.alert(
        'Esqueceu sua senha?',
        'Digite seu nome de usuário no campo acima e tente novamente.'
      );
      return;
    }
    const dados = await AsyncStorage.getItem('@usuarios');
    const usuarios = dados ? JSON.parse(dados) : [];
    const encontrado = usuarios.find(
      u => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );
    if (!encontrado) {
      Alert.alert('Usuário não encontrado', 'Não existe conta com esse nome de usuário.');
      return;
    }
    Alert.alert(
      'Dica de senha',
      `A senha da conta "${encontrado.usuario}" foi cadastrada por você no momento do cadastro.\n\nCaso não lembre, delete o app e recadastre-se.`,
      [{ text: 'Entendi', style: 'default' }]
    );
  }

  // ScrollView com keyboardShouldPersistTaps="handled" garante que toques em botões 
  // dentro do scroll funcionem mesmo com o teclado aberto. 
  // Sem isso, o primeiro toque apenas fecharia o teclado
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cabeçalho visual com logo, nome e slogan do app */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/borboleta.png')}
          style={styles.logo}
          resizeMode="contain"
        />     
        <Text style={styles.appNome}>VIOLETA</Text>
        <Text style={styles.appSlogan}>Silêncio Nunca Mais</Text>
      </View>

      {/* Card animado: desliza de baixo para cima e faz fade ao entrar na tela
          cardAnim vai de 0→1 e é mapeado para opacidade e translateY simultaneamente */}
      <Animated.View style={[
        styles.card,
        {
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0], // começa 24px abaixo e sobe até a posição final
            })
          }]
        }
      ]}>      
        <Text style={styles.titulo}>Entrar</Text>

        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu usuário"
          placeholderTextColor="#AB92BF"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none" // evita que o teclado capitalize a primeira letra
        />

        <Text style={styles.label}>Senha</Text>
        {/* Container da senha: agrupa o TextInput e o botão de olho
            em uma linha horizontal (flexDirection: 'row') */}
        <View style={styles.inputSenhaContainer}>
          <TextInput
            style={styles.inputSenha}
            placeholder="Sua senha"
            placeholderTextColor="#AB92BF"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!senhaVisivel} // true = oculta, false = visível
          />
          {/* Alterna visibilidade da senha ao tocar no ícone */}
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Ionicons
              name={senhaVisivel ? 'eye-off' : 'eye'}
              size={24}
              color="#AB92BF"
            />
          </TouchableOpacity>
        </View>
        
         {/* Link discreto de recuperação de senha, alinhado à direita */}
        <TouchableOpacity style={styles.botaoEsqueceu} onPress={esqueceuSenha}>
          <Text style={styles.textoEsqueceu}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        {/* Botão principal de login */}
        <Animated.View style={{ transform: [{ scale: escalaEntrar }] }}>
          <TouchableOpacity style={styles.botao} onPress={entrar}>
            <Text style={styles.textoBotao}>Entrar</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Separador visual "ou" entre as duas ações principais */}
        <View style={styles.separador}>
          <View style={styles.linha} />
          <Text style={styles.separadorTexto}>ou</Text>
          <View style={styles.linha} />
        </View>

        {/* Botão secundário para ir à tela de cadastro */}
        <Animated.View style={{ transform: [{ scale: escalaCadastro }] }}>
          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => animarBotao(escalaCadastro, onIrCadastro)}
          >
            <Text style={styles.textoBotaoSecundario}>Criar nova conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

       {/* Rodapé reforçando a privacidade: dados ficam só no dispositivo */}
      <Text style={styles.rodape}>
        Seus dados ficam salvos apenas no seu dispositivo.
      </Text>
    </ScrollView>
  );
}

// -- Estilos --
// StyleSheet.create() agrupa todos os estilos da tela
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,    // permite que o ScrollView ocupe toda a altura
    backgroundColor: '#1E1A2E',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 140, height: 140, marginBottom: -34 },
  appNome: { fontSize: 26, fontWeight: 'bold', color: '#DBCBD8', letterSpacing: 8, marginBottom: 4, textAlign: 'center', },
  appSlogan: { fontSize: 13, color: '#DBCBD8', fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#2D2450',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#3D3468',
    shadowColor: '#564787',   // sombra no iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,   // sombra no Android
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#F2FDFF', marginBottom: 20, textAlign: 'center' },
  label: { color: '#DBCBD8', fontWeight: 'bold', fontSize: 14, marginBottom: 6, marginTop: 10 },
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
    flexDirection: 'row',       // coloca o input e o ícone lado a lado
    alignItems: 'center',
    backgroundColor: '#1E1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3468',
    paddingRight: 12,
  },
  inputSenha: { flex: 1, color: '#F2FDFF', padding: 14, fontSize: 15 },
  olho: { fontSize: 20 },
  botaoEsqueceu: { alignItems: 'flex-end', marginTop: 8, marginBottom: 4 },
  textoEsqueceu: { color: '#AB92BF', fontSize: 13 },
  botao: {
    backgroundColor: '#564787',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBotao: { color: '#F2FDFF', fontWeight: 'bold', fontSize: 16 },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  linha: { flex: 1, height: 1, backgroundColor: '#3D3468' },
  separadorTexto: { color: '#AB92BF', marginHorizontal: 10, fontSize: 13 },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#564787',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoBotaoSecundario: { color: '#AB92BF', fontWeight: 'bold', fontSize: 15 },
  rodape: { color: '#AB92BF', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
