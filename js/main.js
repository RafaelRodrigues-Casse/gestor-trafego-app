/**
 * Vine Tech App
 * Main JS — Login simples + Supabase
 * Focado em: LOGIN FUNCIONAL + REDIRECIONAR PARA INDEX
 */

// =============================
// DEBUG INICIAL
// =============================
console.log("main.js carregado (Vine Tech)");

/**
 * Se quiser, pode comentar essa linha depois:
 * // alert("main.js carregado (Vine Tech)");
 */
alert("main.js carregado (Vine Tech)");

// =============================
// CONFIGURAÇÃO SUPABASE
// =============================
const SUPABASE_URL = "https://yqxylyzizbrhtxsjxqet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_L4npCOhNObMqKRh4u550KA_x3hwoAJT";

let supabaseClient = null;

try {
  const globalSupabase = window.supabase;

  if (!globalSupabase || typeof globalSupabase.createClient !== "function") {
    throw new Error("Supabase SDK global não encontrado em window.supabase");
  }

  supabaseClient = globalSupabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("Supabase client criado com sucesso ✅");
} catch (e) {
  console.error("Erro ao criar cliente Supabase:", e);
  alert(
    "Erro ao inicializar a conexão com o servidor (Supabase). " +
      "Abra o console (F12 > Console) para ver os detalhes."
  );
}

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
  console.log("Redirecionando para:", url);
  window.location.href = url;
}

function formatErrorMessage(error) {
  if (!error) return "Ocorreu um erro. Tente novamente.";
  if (error.message) return error.message;
  return String(error);
}

// =============================
// APP
// =============================

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded disparado");
  App.init();
});

const App = {
  state: {
    user: null,
    isAuthenticated: false,
  },

  async init() {
    console.log("Vine Tech App iniciado 🚀");

    this.cacheElements();

    if (!supabaseClient) {
      this.showLoginError(
        "Erro ao conectar com o servidor de autenticação. Tente recarregar a página (CTRL+F5)."
      );
      return;
    }

    await this.checkAuth();
    this.setupPage();
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

    console.log("Elementos de login encontrados:", {
      loginForm: !!this.loginForm,
      loginEmailInput: !!this.loginEmailInput,
      loginPasswordInput: !!this.loginPasswordInput,
      loginButton: !!this.loginButton,
      forgotPasswordButton: !!this.forgotPasswordButton,
      loginErrorBox: !!this.loginErrorBox,
    });
  },

  // ---------------------------
  // AUTENTICAÇÃO
  // ---------------------------
  async checkAuth() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Erro ao verificar autenticação:", error.message);
      this.state.user = null;
      this.state.isAuthenticated = false;
      return;
    }

    this.state.user = data.user;
    this.state.isAuthenticated = !!data.user;

    console.log("Auth status:", this.state.isAuthenticated);
  },

  setupPage() {
    console.log("setupPage() — pathname:", window.location.pathname);

    if (isLoginPage()) {
      console.log("Página detectada: LOGIN");
      this.setupLoginPage();
    } else {
      console.log("Página pública (index ou outra).");
      this.render();
    }
  },

  render() {
    if (!this.state.isAuthenticated) {
      console.log("Usuário não autenticado");
    } else {
      console.log("Usuário autenticado:", this.state.user.email);
    }
  },

  // =============================
  // LOGIN PAGE
  // =============================

  setupLoginPage() {
    // Se já está autenticado, manda direto para a home
    if (this.state.isAuthenticated) {
      console.log("Usuário já autenticado. Indo para index.html...");
      navigateTo("index.html");
      return;
    }

    if (!this.loginForm) {
      console.warn("setupLoginPage: #loginForm não encontrado.");
      return;
    }

    console.log("Registrando handlers na página de login...");

    // SUBMIT (ENTER)
    this.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("submit do formulário disparado");
      await this.handleLoginSubmit();
    });

    // Clique no botão "Entrar"
    if (this.loginButton) {
      this.loginButton.addEventListener("click", async (event) => {
        event.preventDefault();
        console.log("Clique no botão Entrar disparado");
        await this.handleLoginSubmit();
      });
    }

    // Clique em "Esqueci minha senha"
    if (this.forgotPasswordButton) {
      this.forgotPasswordButton.addEventListener("click", async (event) => {
        event.preventDefault();
        console.log("Clique em Esqueci minha senha disparado");
        await this.handleForgotPassword();
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
  // LOGIN SIMPLES
  // =============================
  async handleLoginSubmit() {
    console.log("handleLoginSubmit() chamado");
    this.clearLoginError();

    const email = (this.loginEmailInput?.value || "").trim();
    const password = (this.loginPasswordInput?.value || "").trim();

    if (!email || !password) {
      this.showLoginError("Por favor, preencha e-mail e senha para entrar.");
      alert("Preencha e-mail e senha.");
      return;
    }

    if (!supabaseClient) {
      const msg =
        "Erro interno: conexão com o servidor de autenticação não está disponível.";
      console.error(msg);
      this.showLoginError(msg);
      alert(msg);
      return;
    }

    console.log("Tentando login com:", email);
    alert("Tentando login com: " + email);

    if (this.loginButton) {
      this.loginButton.disabled = true;
      this.loginButton.textContent = "Entrando...";
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Resposta do Supabase (signInWithPassword):", { data, error });

      if (error) {
        console.error("Erro no login Supabase:", error);
        this.showLoginError("E-mail ou senha inválidos. Tente novamente.");
        alert("Falha no login: " + (error.message || String(error)));
        return;
      }

      const user = data.user;
      this.state.user = user;
      this.state.isAuthenticated = true;

      console.log("Usuário logado:", user.email);
      console.log("app_metadata recebido:", user.app_metadata);

      alert("Login OK! Redirecionando para o Vine Tech (index.html)...");
      navigateTo("index.html");
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      this.showLoginError(formatErrorMessage(err));
      alert("Erro inesperado: " + formatErrorMessage(err));
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
    console.log("handleForgotPassword() chamado");

    this.clearLoginError();

    const email = (this.loginEmailInput?.value || "").trim();

    if (!email) {
      this.showLoginError(
        "Por favor, informe o e-mail usado no cadastro para recuperar a senha."
      );
      alert("Informe o e-mail para recuperar a senha.");
      return;
    }

    if (!supabaseClient) {
      const msg =
        "Erro interno: conexão com o servidor de autenticação não está disponível.";
      console.error(msg);
      this.showLoginError(msg);
      alert(msg);
      return;
    }

    try {
      const redirectTo =
        "https://rafaelrodrigues-casse.github.io/gestor-trafego-app/reset-password.html";

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Erro ao enviar e-mail de redefinição:", error.message);
        this.showLoginError(
          "Não foi possível enviar o e-mail de redefinição. Tente novamente em alguns instantes."
        );
        alert(
          "Erro ao enviar e-mail de redefinição: " +
            (error.message || String(error))
        );
        return;
      }

      const msg =
        "Enviamos um link de redefinição de senha para o seu e-mail. " +
        "Verifique sua caixa de entrada e o spam.";
      this.showLoginError(msg);
      alert(msg);
    } catch (err) {
      console.error("Erro inesperado em handleForgotPassword:", err);
      this.showLoginError(formatErrorMessage(err));
      alert("Erro inesperado: " + formatErrorMessage(err));
    }
  },

  // =============================
  // FUNÇÕES PÚBLICAS (EXTRA)
  // =============================
  async login(email, password) {
    if (!supabaseClient) {
      throw new Error("supabaseClient não inicializado.");
    }
    return supabaseClient.auth.signInWithPassword({ email, password });
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
