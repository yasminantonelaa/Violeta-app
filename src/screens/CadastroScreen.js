import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GENEROS = [
  'Mulher cisgênero',
  'Mulher transgênero',
  'Não binário',
  'Gênero fluido',
  'Agênero',
  'Outro gênero correlato ao feminino',
];

export default function CadastroScreen({ onCadastro, onVoltar }) {
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [generoSelecionado, setGeneroSelecionado] = useState(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  async function cadastrar() {
    if (!nome.trim() || !usuario.trim() || !senha || !confirmarSenha) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (usuario.trim().length < 3) {
      Alert.alert('Usuário inválido', 'O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }
    if (!generoSelecionado) {
      Alert.alert('Autodeclaração necessária', 'Por favor, selecione como você se identifica.');
      return;
    }
    if (!aceitouTermos) {
      Alert.alert('Confirmação necessária', 'Por favor, confirme sua autodeclaração.');
      return;
    }

    const dados = await AsyncStorage.getItem('@usuarios');
    const usuarios = dados ? JSON.parse(dados) : [];

    const existe = usuarios.find(
      u => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );
    if (existe) {
      Alert.alert('Usuário indisponível', 'Este nome de usuário já está em uso. Escolha outro.');
      return;
    }

    const novoUsuario = {
      id: Date.now().toString(),
      nome: nome.trim(),
      usuario: usuario.trim(),
      senha,
      genero: generoSelecionado,
    };

    const lista = [...usuarios, novoUsuario];
    await AsyncStorage.setItem('@usuarios', JSON.stringify(lista));
    await AsyncStorage.setItem('@usuarioLogado', JSON.stringify(novoUsuario));

    Alert.alert('Bem-vinda! 💜', `Conta criada com sucesso, ${nome.trim()}!`, [
      { text: 'Entrar', onPress: onCadastro }
    ]);
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
        <Text style={styles.titulo}>Criar conta</Text>

        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Como você quer ser chamada?"
          placeholderTextColor="#888"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Escolha um usuário único"
          placeholderTextColor="#888"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputSenhaContainer}>
          <TextInput
            style={styles.inputSenha}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#888"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!senhaVisivel}
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Text style={styles.olho}>{senhaVisivel ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Repita sua senha"
          placeholderTextColor="#888"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry={!senhaVisivel}
        />

        <Text style={styles.label}>Como você se identifica?</Text>
        <Text style={styles.sublabel}>
          O Violeta é um espaço seguro para mulheres e pessoas de gêneros correlatos ao feminino.
        </Text>

        {GENEROS.map(genero => (
          <TouchableOpacity
            key={genero}
            style={[styles.opcaoGenero, generoSelecionado === genero && styles.opcaoSelecionada]}
            onPress={() => setGeneroSelecionado(genero)}
          >
            <View style={[styles.radio, generoSelecionado === genero && styles.radioSelecionado]}>
              {generoSelecionado === genero && <View style={styles.radioDentro} />}
            </View>
            <Text style={[styles.textoOpcao, generoSelecionado === genero && styles.textoOpcaoSelecionado]}>
              {genero}
            </Text>
          </TouchableOpacity>
        ))}

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

        <TouchableOpacity style={styles.botao} onPress={cadastrar}>
          <Text style={styles.textoBotao}>Criar conta 💜</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoVoltar} onPress={onVoltar}>
          <Text style={styles.textoVoltar}>← Já tenho conta</Text>
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
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 80, height: 80, marginBottom: 10, tintColor: '#9C27B0' },
  appNome: { fontSize: 30, fontWeight: 'bold', color: '#9C27B0', letterSpacing: 8 },
  appSlogan: { fontSize: 12, color: '#ce93d8', fontStyle: 'italic', marginTop: 2 },
  card: {
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#6A0DAD',
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16, textAlign: 'center' },
  label: { color: '#ce93d8', fontWeight: 'bold', fontSize: 14, marginBottom: 6, marginTop: 12 },
  sublabel: { color: '#888', fontSize: 12, marginBottom: 10, lineHeight: 18 },
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
  opcaoGenero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  opcaoSelecionada: { borderColor: '#9C27B0', backgroundColor: '#2d1b4e' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#666',
    marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  radioSelecionado: { borderColor: '#9C27B0' },
  radioDentro: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9C27B0' },
  textoOpcao: { color: '#aaa', fontSize: 14, flex: 1 },
  textoOpcaoSelecionado: { color: '#fff', fontWeight: 'bold' },
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 24,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#6A0DAD',
    marginRight: 12, alignItems: 'center',
    justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  checkboxMarcado: { backgroundColor: '#6A0DAD' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  textoCheck: { color: '#aaa', fontSize: 12, flex: 1, lineHeight: 18 },
  botao: {
    backgroundColor: '#6A0DAD',
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botaoVoltar: { alignItems: 'center', marginTop: 16, padding: 8 },
  textoVoltar: { color: '#9C27B0', fontSize: 14 },
  rodape: { color: '#444', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
