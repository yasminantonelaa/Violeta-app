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
          placeholderTextColor="#888"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputSenhaContainer}>
          <TextInput
            style={styles.inputSenha}
            placeholder="Sua senha"
            placeholderTextColor="#888"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!senhaVisivel}
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Text style={styles.olho}>{senhaVisivel ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

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
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 100, height: 100, marginBottom: 10, tintColor: '#9C27B0' },
  appNome: { fontSize: 34, fontWeight: 'bold', color: '#9C27B0', letterSpacing: 8 },
  appSlogan: { fontSize: 13, color: '#ce93d8', fontStyle: 'italic', marginTop: 2 },
  card: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#6A0DAD',
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  label: { color: '#ce93d8', fontWeight: 'bold', fontSize: 14, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    fontSize: 15,
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    paddingRight: 12,
  },
  inputSenha: { flex: 1, color: '#fff', padding: 14, fontSize: 15 },
  olho: { fontSize: 20 },
  botao: {
    backgroundColor: '#6A0DAD',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  linha: { flex: 1, height: 1, backgroundColor: '#444' },
  separadorTexto: { color: '#666', marginHorizontal: 10, fontSize: 13 },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#6A0DAD',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoBotaoSecundario: { color: '#9C27B0', fontWeight: 'bold', fontSize: 15 },
  rodape: { color: '#444', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
