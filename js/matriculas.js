// matriculas.js — Firebase v10 (modular via CDN) + Firestore
// Coloque no HTML: <script type="module" src="matriculas.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   CONFIGURAÇÃO DO FIREBASE
   ========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAzavu7lRQPAi--SFecOg2FE6f0WlDyTPE",
  authDomain: "matriculas-madeinsertao.firebaseapp.com",
  projectId: "matriculas-madeinsertao",               // sem acento
  storageBucket: "matriculas-madeinsertao.appspot.com", // appspot.com (correto p/ bucket)
  messagingSenderId: "426884127493",
  appId: "1:426884127493:web:7c83d74f972af209c8b56c",
  measurementId: "G-V2DH0RHXEE"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* =========================
   UTILITÁRIOS
   ========================= */
function exibirNotificacao(mensagem, erro = false) {
  const notificacao = document.getElementById('notificacao');
  if (!notificacao) {
    alert(mensagem);
    return;
  }
  notificacao.textContent = mensagem;
  notificacao.style.position = 'fixed';
  notificacao.style.top = '20px';
  notificacao.style.left = '50%';
  notificacao.style.transform = 'translateX(-50%)';
  notificacao.style.padding = '12px 24px';
  notificacao.style.borderRadius = '10px';
  notificacao.style.color = '#fff';
  notificacao.style.fontWeight = '600';
  notificacao.style.fontSize = '16px';
  notificacao.style.backgroundColor = erro ? '#c0392b' : '#27ae60';
  notificacao.style.zIndex = '10000';
  notificacao.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  notificacao.style.maxWidth = '90%';
  notificacao.style.textAlign = 'center';

  setTimeout(() => {
    notificacao.textContent = '';
    notificacao.removeAttribute('style');
  }, 6000);
}

function validarCPF(cpf) {
  if (!cpf) return false;
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

function gerarCodigoEscola(nomeEscola) {
  const codigos = {
    "Escola de Ensino Infantil e Fundamental Maria do Carmo": "MC",
    "Escola de Ensino Médio Alfredo Machado": "AM",
    "CEI Mãe Toinha": "MT",
    "CEI Sara Rosita": "SR",
    "CEI Raio de Luz": "RL",
    "CEI Pequeno Aprendiz": "PA",
    "CEI Criança Feliz": "CF",
    "CEI Luz do Saber": "LS",
    "CEI Mundo Encantado": "ME",
    "CEI Sonho de Criança": "SC",
    "CEI José Edson do Nascimento": "JE",
    "CEI José Alzir Silva Lima": "JA"
  };
  return codigos[nomeEscola] || "EMM";
}

/* =========================
   LÓGICA PRINCIPAL
   ========================= */
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formMatricula');
  if (!form) {
    console.warn("⚠️ Formulário #formMatricula não encontrado no DOM.");
    return;
  }
  const btnEnviar = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Desabilita botão
    if (btnEnviar) {
      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';
    }

    try {
      const formData = new FormData(form);

      // Campos do aluno
      const nome  = (formData.get('nome') || '').toString().trim();
      const cpf   = (formData.get('cpf')  || '').toString().replace(/\D/g, '');
      const idade = (formData.get('idade') || '').toString().trim(); // se for data, adaptar p/ Date depois
      const sexo  = (formData.get('sexo') || '').toString();
      const raca  = (formData.get('raca') || '').toString();
      const religiao = (formData.get('religiao') || '').toString();
      const escola   = (formData.get('escola') || '').toString();
      const rede     = (formData.get('rede')   || '').toString();
      const bairro   = (formData.get('bairro') || '').toString();
      const tipoMatricula = (formData.get('tipoMatricula') || '').toString(); // A / B

      // Listas
      const oficinas  = formData.getAll('oficinas[]').map(v => v.toString());
      const programas = formData.getAll('programas[]').map(v => v.toString());

      // Responsável
      const responsavel = {
        nome: (formData.get('responsavel') || '').toString().trim(),
        telefone: (formData.get('telefone') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        integrantes: (formData.get('integrantes') || '').toString()
      };

      // Validações mínimas
      if (!nome) throw new Error("Informe o nome do aluno.");
      if (!validarCPF(cpf)) {
        exibirNotificacao("❗ CPF inválido. Por favor, verifique e tente novamente.", true);
        return;
      }
      if (!escola) throw new Error("Selecione a escola.");
      if (!tipoMatricula) throw new Error("Selecione Matrícula (A) ou Rematrícula (B).");

      // Verifica duplicidade por CPF
      const dupQuery = query(collection(db, "matriculas"), where("cpf", "==", cpf));
      const dupSnap  = await getDocs(dupQuery);
      if (!dupSnap.empty) {
        exibirNotificacao("❗ Sua matrícula já foi realizada. O CPF informado já está cadastrado.", true);
        return;
      }

      // Geração de número de matrícula
      const anoFixo = 2025; // ajuste se quiser dinâmico: new Date().getFullYear()
      const codigoEscola = gerarCodigoEscola(escola);

      // Conta quantos já existem para a mesma escola/ano para gerar sequencial
      const seqQuery = query(
        collection(db, "matriculas"),
        where("ano", "==", anoFixo),
        where("escola", "==", escola)
      );
      const seqSnap = await getDocs(seqQuery);
      const contador = seqSnap.size + 1;
      const sequencial = String(contador).padStart(4, '0'); // XXXX

      const numeroMatricula = `${anoFixo}-${tipoMatricula}-${codigoEscola}-${sequencial}`;

      // Salva no Firestore
      await addDoc(collection(db, "matriculas"), {
        numeroMatricula,
        ano: anoFixo,
        nome,
        cpf,
        idade,
        sexo,
        raca,
        religiao,
        escola,
        bairro,
        rede,
        tipoMatricula,
        oficinas,
        programas,
        responsavel,
        dataEnvio: new Date().toISOString()
      });

      exibirNotificacao(`${nome}, sua matrícula foi efetuada com sucesso!`);
      form.reset();
    } catch (err) {
      console.error("Erro ao enviar matrícula:", err);
      exibirNotificacao(`❌ Erro ao enviar matrícula. ${err?.message || 'Tente novamente mais tarde.'}`, true);
    } finally {
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar Matrícula';
      }
    }
  });
});
