// login.js — Firebase Auth (email/senha) + redirecionamento seguro
// <script type="module" src="login.js"></script> em login.html

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzavu7lRQPAi--SFecOg2FE6f0WlDyTPE",
  authDomain: "matriculas-madeinsertao.firebaseapp.com",
  projectId: "matriculas-madeinsertao",
  storageBucket: "matriculas-madeinsertao.appspot.com",
  messagingSenderId: "426884127493",
  appId: "1:426884127493:web:7c83d74f972af209c8b56c",
  measurementId: "G-V2DH0RHXEE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Persistência local (permanece logado após refresh)
await setPersistence(auth, browserLocalPersistence);

// Se já estiver logado e abrir login.html, manda pro dashboard
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (location.pathname.endsWith("login.html")) {
      // limpa histórico pra não voltar pro login
      history.replaceState(null, "", "index.html");
      location.href = "index.html";
    }
  }
});

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("usuario"); // pode ser email
const senhaInput = document.getElementById("senha");
const erro = document.getElementById("erro");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  erro.textContent = "";

  const email = (emailInput?.value || "").trim();
  const senha = (senhaInput?.value || "").trim();

  if (!email || !senha) {
    erro.textContent = "Informe e-mail e senha.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    // Redireciona e limpa histórico
    history.replaceState(null, "", "index.html");
    location.href = "index.html";
  } catch (e2) {
    console.error(e2);
    erro.textContent = traduzErroAuth(e2?.code);
  }
});

function traduzErroAuth(code) {
  switch (code) {
    case "auth/invalid-email": return "E-mail inválido.";
    case "auth/user-disabled": return "Usuário desativado.";
    case "auth/user-not-found": return "Usuário não encontrado.";
    case "auth/wrong-password": return "Senha incorreta.";
    case "auth/too-many-requests": return "Muitas tentativas. Tente mais tarde.";
    default: return "Não foi possível entrar. Verifique os dados.";
  }
}
