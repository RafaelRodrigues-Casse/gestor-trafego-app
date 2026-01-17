/**
 * Vine Tech App
 * main.js — Login simples + Redirecionamento para Dashboard
 * Versão com DEBUG forte para garantir funcionamento
 */

// =============================
// CONFIGURAÇÃO SUPABASE
// =============================
const SUPABASE_URL = "https://yqxylyzizbrhtxsjxqet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_L4npCOhNObMqKRh4u550KA_x3hwoAJT";

// vamos criar o client DEPOIS que o Supabase carregar
let supabaseClient = null;

// =============================
// HELPERS
// =============================

function isLoginPage() {
  return window.location.pathname.includes("login.html");
}

function buildAppUrl(pageName) {
  const parts = window.location.pathname.split("/");
  parts[parts.length - 1] = pageName;
  return parts.join("/");
}

function navigateTo(pageName) {
  const url = buildAppUrl(pageName);
  window.location.href = url;
}

function formatErrorMessage(error) {
  if (!error) return "Ocorreu um erro. Tente novamente.";
  if (error.message) return error.message;
  return String(error);
}

// =============================
// APLICAÇÃO
// =============================

document.addEventListener("DOMContentLoaded", () => {
  alert("main.js carregado (Vine Tech v2)");
  console.log("main.js carregado (Vine Tech v2)");

  // garante que a biblioteca do Supabase existe
  if (!window.supabase) {
    alert("ERRO: biblioteca @supabase/supabase-js NÃO carregou.");
    console.error("window.supabase está undefined. Verifique a tag <script> do Supabase no login.html.");
    return;
  }

  // agora sim criamos o client
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("Supabase client criado:", !!supabaseClient);

  App.init();
});

const App = {
  state: {
    user: null,
    isAuthenticated: false,
  },

  async init() {
    this.cacheElements();

    if (isLoginPage()) {
      alert("Página de login detectada (init)");
      this.setupLoginPage();
    } else {
      console.log("Não é página de login, App.init terminou.");
    }
  },

  cacheElements() {
    this.header = document.querySelector(".app-header");
    this.main = document.querySelector(".app-main");
    this.footer = document.querySelector(".app-footer");

    this.loginForm = document.querySelector("#loginForm");
    this.loginEmailInput = document.querySelector("#loginEmail");
    this.loginPasswordInput = document.querySelector("#loginPassword");
    this.loginButton = document.querySelector("#loginButton");
    this.forgotPasswordButton =
      document.querySelector("#forgotPasswordButton");
    this.loginErrorBox = document.querySelector("#loginError");

    console.log("Elementos cacheados:", {
      loginForm: !!this.loginForm,
      loginEmailInput: !!this.loginEmailInput,
      loginPasswordInput: !!this.loginPasswordInput,
      loginButton: !!this.loginButton,
      forgotPasswordButton: !!this.forgotPasswordButton,
      loginErrorBox: !!this.loginErrorBox,
    });
  },

  // =============================
  // LOGIN PAGE
  // =============================
  setupLoginPage() {
    if (!this.loginForm || !this.loginButton) {
      alert("ERRO: Formulário de login NÃO encontrado no HTML.");
      console.warn("loginForm ou loginButton não encontrados.");
      return;
    }

    alert("Formulário de login encontrado. Handlers conectados.");

    this.loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleLoginSubmit();
    });

    this.loginButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.handleLoginSubmit();
    });

    if (this.forgotPasswordButton) {
      this.forgotPasswordButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.handleForgotPassword();
      });
    }
  },

  showLoginError(message) {
    if (!this.loginErrorBox) {
      alert(message);
      return;
    }

    this.loginErrorBox.textContent = message;
    this.loginErrorBox.style.display = "block";
  },

  clearLoginError() {
    if (!this.loginErrorBox) return;
    this.loginErrorBox.textContent = "";
    this.loginErrorBox.style.display = "none";
  },

  // =============================
  // LOGIN SIMPLIFICADO
  // =============================
  async handleLoginSubmit() {
    this.clearLoginError();

    const email = (this.loginEmailInput?.value || "").trim();
    const password = (this.loginPasswordInput?.value || "").trim();

    alert("handleLoginSubmit chamado. Email: " + email);

    if (!email || !password) {
      const msg = "Por favor, preencha e-mail e senha para entrar.";
      this.showLoginError(msg);
      alert(msg);
      return;
    }

    if (!supabaseClient) {
      const msg =
        "Client do Supabase não foi inicializado. Verifique se o script do Supabase carregou corretamente.";
      console.error(msg);
      alert(msg);
      return;
    }

    if (this.loginButton) {
      this.loginButton.disabled = true;
      this.loginButton.textContent = "Entrando...";
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Resposta Supabase:", { data, error });

      if (error) {
        console.error("Erro no login:", error);
        const msg =
          "E-mail ou senha inválidos. Verifique os dados e tente novamente.";
        this.showLoginError(msg);
        alert("Falha no login: " + (error.message || String(error)));
        return;
      }

      const user = data.user;
      this.state.user = user;
      this.state.isAuthenticated = true;

      alert("Login OK para: " + user.email + " — redirecionando…");

      // 👉 Depois podemos mudar para outro dashboard se quiser
      navigateTo("dashboard.html");
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      const msg = formatErrorMessage(err);
      this.showLoginError(msg);
      alert("Erro inesperado: " + msg);
    } finally {
      if (this.loginButton) {
        this.loginButton.disabled = false;
        this.loginButton.textContent = "Entrar";
      }
    }
  },

  async handleForgotPassword() {
    this.clearLoginError();

    const email = (this.loginEmailInput?.value || "").trim();

    if (!email) {
      const msg =
        "Por favor, informe o e-mail usado no cadastro para recuperar a senha.";
      this.showLoginError(msg);
      alert(msg);
      return;
    }

    if (!supabaseClient) {
      const msg =
        "Client do Supabase não foi inicializado. Verifique se o script do Supabase carregou corretamente.";
      console.error(msg);
      alert(msg);
      return;
    }

    try {
      const redirectTo =
        "https://rafaelrodrigues-casse.github.io/gestor-trafego-app/reset-password.html";

      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );

      if (error) {
        console.error("Erro ao enviar e-mail de redefinição:", error);
        const msg =
          "Não foi possível enviar o e-mail de redefinição. Tente novamente em alguns instantes.";
        this.showLoginError(msg);
        alert(msg);
        return;
      }

      const msg =
        "Enviamos um link de redefinição de senha para o seu e-mail. " +
        "Verifique sua caixa de entrada e o spam.";
      this.showLoginError(msg);
      alert(msg);
    } catch (err) {
      console.error("Erro inesperado em handleForgotPassword:", err);
      const msg = formatErrorMessage(err);
      this.showLoginError(msg);
      alert("Erro inesperado: " + msg);
    }
  },

  async logout() {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    this.state.user = null;
    this.state.isAuthenticated = false;
    navigateTo("login.html");
  },
};
