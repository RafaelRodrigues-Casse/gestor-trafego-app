/**
 * Vine Tech App
 * Main JS — Login simples + Redirecionamento para Dashboard
 * Versão simplificada e estável para MVP
 */

// =============================
// CONFIGURAÇÃO SUPABASE
// =============================
const SUPABASE_URL = "https://yqxylyzizbrhtxsjxqet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_L4npCOhNObMqKRh4u550KA_x3hwoAJT";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// =============================
// HELPERS
// =============================

/**
 * Descobre se estamos na página de login.
 */
function isLoginPage() {
  return window.location.pathname.includes("login.html");
}

/**
 * Monta uma URL para outra página do app,
 * respeitando o caminho atual (GitHub Pages, etc).
 */
function buildAppUrl(pageName) {
  const parts = window.location.pathname.split("/");
  parts[parts.length - 1] = pageName;
  return parts.join("/");
}

/**
 * Redireciona para outra página do app.
 */
function navigateTo(pageName) {
  const url = buildAppUrl(pageName);
  window.location.href = url;
}

/**
 * Formata mensagem de erro.
 */
function formatErrorMessage(error) {
  if (!error) return "Ocorreu um erro. Tente novamente.";
  if (error.message) return error.message;
  return String(error);
}

// =============================
// APLICAÇÃO
// =============================

document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js carregado (Vine Tech)");
  App.init();
});

const App = {
  state: {
    user: null,
    isAuthenticated: false,
  },

  // ---------------------------
  // INICIALIZAÇÃO
  // ---------------------------
  async init() {
    this.cacheElements();

    if (isLoginPage()) {
      this.setupLoginPage();
    }
  },

  cacheElements() {
    // Elementos do layout (para uso futuro)
    this.header = document.querySelector(".app-header");
    this.main = document.querySelector(".app-main");
    this.footer = document.querySelector(".app-footer");

    // Elementos do LOGIN (se existirem)
    this.loginForm = document.querySelector("#loginForm");
    this.loginEmailInput = document.querySelector("#loginEmail");
    this.loginPasswordInput = document.querySelector("#loginPassword");
    this.loginButton = document.querySelector("#loginButton");
    this.forgotPasswordButton =
      document.querySelector("#forgotPasswordButton");
    this.loginErrorBox = document.querySelector("#loginError");
  },

  // =============================
  // LOGIN PAGE
  // =============================
  setupLoginPage() {
    console.log("Configuração da página de login...");

    if (!this.loginForm || !this.loginButton) {
      console.warn("Elementos do formulário de login não encontrados.");
      alert(
        "Erro ao carregar o formulário de login. Verifique o HTML do login."
      );
      return;
    }

    // SUBMIT (apertar Enter)
    this.loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleLoginSubmit();
    });

    // Clique no botão "Entrar"
    this.loginButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.handleLoginSubmit();
    });

    // Clique em "Esqueci minha senha"
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

    if (!email || !password) {
      const msg = "Por favor, preencha e-mail e senha para entrar.";
      this.showLoginError(msg);
      alert(msg);
      return;
    }

    console.log("Tentando login com:", email);

    // Desabilita o botão enquanto faz o login
    if (this.loginButton) {
      this.loginButton.disabled = true;
      this.loginButton.textContent = "Entrando...";
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Resposta do Supabase:", { data, error });

      if (error) {
        console.error("Erro no login:", error);
        const msg =
          "E-mail ou senha inválidos. Verifique os dados e tente novamente.";
        this.showLoginError(msg);
        alert(msg);
        return;
      }

      const user = data.user;
      this.state.user = user;
      this.state.isAuthenticated = true;

      console.log("Login OK para:", user.email);

      alert("Login realizado com sucesso! Redirecionando para o painel.");
      // 👉 Aqui já vamos direto para o DASHBOARD
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

  // =============================
  // ESQUECI MINHA SENHA
  // =============================
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

    try {
      const redirectTo =
        "https://rafaelrodrigues-casse.github.io/gestor-trafego-app/reset-password.html";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

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

  // =============================
  // LOGOUT (para usar no futuro)
  // =============================
  async logout() {
    await supabase.auth.signOut();
    this.state.user = null;
    this.state.isAuthenticated = false;
    navigateTo("login.html");
  },
};
