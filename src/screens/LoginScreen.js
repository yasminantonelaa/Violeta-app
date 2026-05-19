import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ onLogin, onIrCadastro }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  async function entrar() {
    if (!usuario.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha usuário e senha.');
      return;
    }
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
    await AsyncStorage.setItem('@usuarioLogado', JSON.stringify(encontrado));
    onLogin();
  }

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
      'Dica de senha 💜',
      `A senha da conta "${encontrado.usuario}" foi cadastrada por você no momento do cadastro.\n\nCaso não lembre, delete o app e recadastre-se.`,
      [{ text: 'Entendi', style: 'default' }]
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/borboleta.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appNome}>VIOLETA</Text>
        <Text style={styles.appSlogan}>Silêncio Nunca Mais</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.titulo}>Entrar</Text>

        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu usuário"
          placeholderTextColor="#C4A0BA"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputSenhaContainer}>
          <TextInput
            style={styles.inputSenha}
            placeholder="Sua senha"
            placeholderTextColor="#C4A0BA"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!senhaVisivel}
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Text style={styles.olho}>{senhaVisivel ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botaoEsqueceu} onPress={esqueceuSenha}>
          <Text style={styles.textoEsqueceu}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao} onPress={entrar}>
          <Text style={styles.textoBotao}>Entrar 💜</Text>
        </TouchableOpacity>

        <View style={styles.separador}>
          <View style={styles.linha} />
          <Text style={styles.separadorTexto}>ou</Text>
          <View style={styles.linha} />
        </View>

        <TouchableOpacity style={styles.botaoSecundario} onPress={onIrCadastro}>
          <Text style={styles.textoBotaoSecundario}>Criar nova conta</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.rodape}>
        Seus dados ficam salvos apenas no seu dispositivo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FDF0F5',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 100, height: 100, marginBottom: 10, tintColor: '#C06090' },
  appNome: { fontSize: 34, fontWeight: 'bold', color: '#C06090', letterSpacing: 8 },
  appSlogan: { fontSize: 13, color: '#A080B0', fontStyle: 'italic', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E8C0D8',
    shadowColor: '#C06090',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#C06090', marginBottom: 20, textAlign: 'center' },
  label: { color: '#A080B0', fontWeight: 'bold', fontSize: 14, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#FDF0F5',
    color: '#6D3B5E',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8C0D8',
    fontSize: 15,
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8C0D8',
    paddingRight: 12,
  },
  inputSenha: { flex: 1, color: '#6D3B5E', padding: 14, fontSize: 15 },
  olho: { fontSize: 20 },
  botaoEsqueceu: { alignItems: 'flex-end', marginTop: 8, marginBottom: 4 },
  textoEsqueceu: { color: '#A080B0', fontSize: 13 },
  botao: {
    backgroundColor: '#C06090',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  linha: { flex: 1, height: 1, backgroundColor: '#F0D0E0' },
  separadorTexto: { color: '#C4A0BA', marginHorizontal: 10, fontSize: 13 },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#C06090',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoBotaoSecundario: { color: '#C06090', fontWeight: 'bold', fontSize: 15 },
  rodape: { color: '#C4A0BA', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
