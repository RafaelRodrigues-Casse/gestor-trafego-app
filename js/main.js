/**
 * Vine Tech App
 * Main JS — Auth + Controle de Acesso + Login
 * Pronto para GitHub Pages + Supabase
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
// HELPERS GERAIS
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
  // troca apenas o último segmento (arquivo .html)
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
 * Formata uma mensagem de erro amigável.
 */
function formatErrorMessage(error) {
  if (!error) return "Ocorreu um erro. Tente novamente.";
  if (error.message) return error.message;
  return String(error);
}

// =============================
// APLICAÇÃO PRINCIPAL
// =============================

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  state: {
    user: null,
    isAuthenticated: false,
    access: null, // registro da tabela user_access
  },

  // ---------------------------
  // INICIALIZAÇÃO
  // ---------------------------
  async init() {
    console.log("Vine Tech App iniciado 🚀");

    this.cacheElements();
    await this.checkAuth();
    this.setupPage();
  },

  cacheElements() {
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

  // ---------------------------
  // AUTENTICAÇÃO / SESSÃO
  // ---------------------------
  async checkAuth() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao verificar autenticação:", error.message);
      this.state.user = null;
      this.state.isAuthenticated = false;
      this.state.access = null;
      return;
    }

    this.state.user = data.user;
    this.state.isAuthenticated = !!data.user;

    if (this.state.isAuthenticated && this.state.user) {
      await this.loadUserAccess(this.state.user);
    }

    console.log("Auth status:", this.state.isAuthenticated);
  },

  /**
   * Carrega o registro da tabela user_access para o usuário logado.
   */
  async loadUserAccess(user) {
    try {
      const { data: access, error } = await supabase
        .from("user_access")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar user_access:", error.message);
        this.state.access = null;
        return;
      }

      this.state.access = access;
    } catch (err) {
      console.error("Erro inesperado em loadUserAccess:", err);
      this.state.access = null;
    }
  },

  /**
   * Verifica se o acesso do usuário está expirado.
   * Retorna true se estiver expirado ou sem registro.
   */
  isAccessExpired() {
    const access = this.state.access;

    if (!access) {
      // Sem registro => sem acesso liberado
      return true;
    }

    const now = new Date();
    const end = new Date(access.access_end);

    if (access.status === "expired") return true;
    if (Number.isNaN(end.getTime())) return true;
    if (end < now) return true;

    return false;
  },

  /**
   * Configura o comportamento específico da página atual.
   */
  setupPage() {
    if (isLoginPage()) {
      this.setupLoginPage();
    } else {
      // Aqui no futuro vamos proteger páginas privadas,
      // como dashboard, image-analysis etc.
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
    // Se já está autenticado e com acesso ativo, manda direto para a home
    if (this.state.isAuthenticated && !this.isAccessExpired()) {
      console.log(
        "Usuário já autenticado. Redirecionando para a página inicial..."
      );
      navigateTo("index.html"); // por enquanto usamos a home
      return;
    }

    // 🔹 IMPORTANTE: handler do SUBMIT (ENTER ou clique no botão)
    if (this.loginForm) {
      this.loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await this.handleLoginSubmit();
      });
    }

    // Handler extra no botão, caso exista um botão separado
    if (this.loginButton) {
      this.loginButton.addEventListener("click", async (event) => {
        event.preventDefault();
        await this.handleLoginSubmit();
      });
    }

    if (this.forgotPasswordButton) {
      this.forgotPasswordButton.addEventListener("click", async (event) => {
        event.preventDefault();
        await this.handleForgotPassword();
      });
    }
  },

  showLoginError(message) {
    if (!this.loginErrorBox) {
      alert(message); // fallback simples
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

  async handleLoginSubmit() {
    this.clearLoginError();

    const email = (this.loginEmailInput?.value || "").trim();
    const password = (this.loginPasswordInput?.value || "").trim();

    if (!email || !password) {
      this.showLoginError("Por favor, preencha e-mail e senha para entrar.");
      return;
    }

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

      if (error) {
        console.error("Erro no login:", error.message);
        this.showLoginError("E-mail ou senha inválidos. Tente novamente.");
        return;
      }

      const user = data.user;
      this.state.user = user;
      this.state.isAuthenticated = true;

      // Carrega o registro de acesso
      await this.loadUserAccess(user);

      if (this.isAccessExpired()) {
        // Se acesso estiver expirado ou não cadastrado
        await supabase.auth.signOut();
        this.state.user = null;
        this.state.isAuthenticated = false;
        this.state.access = null;

        this.showLoginError(
          "Seu acesso ao Vine Tech está expirado ou ainda não foi liberado. " +
            "Verifique sua assinatura ou fale com o suporte."
        );
        return;
      }

      // Acesso ativo — decide para onde mandar
      const access = this.state.access;

      if (access && access.first_login) {
        // FUTURO: página de primeiro acesso / troca de senha
        console.log(
          "Primeiro acesso detectado. Redirecionando para a página inicial (depois trocamos para primeiro-acesso.html)..."
        );
        navigateTo("index.html");
      } else {
        console.log(
          "Login bem-sucedido. Redirecionando para a página inicial..."
        );
        navigateTo("index.html"); // depois trocamos para dashboard.html
      }
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      this.showLoginError(formatErrorMessage(err));
    } finally {
      // Restaura o botão
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
      this.showLoginError(
        "Por favor, informe o e-mail usado no cadastro para recuperar a senha."
      );
      return;
    }

    try {
      // URL fixa que já configuramos na Supabase
      const redirectTo =
        "https://rafaelrodrigues-casse.github.io/gestor-trafego-app/reset-password.html";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Erro ao enviar e-mail de redefinição:", error.message);
        this.showLoginError(
          "Não foi possível enviar o e-mail de redefinição. Tente novamente em alguns instantes."
        );
        return;
      }

      this.showLoginError(
        "Enviamos um link de redefinição de senha para o seu e-mail. " +
          "Verifique sua caixa de entrada e o spam."
      );
    } catch (err) {
      console.error("Erro inesperado em handleForgotPassword:", err);
      this.showLoginError(formatErrorMessage(err));
    }
  },

  // =============================
  // MÉTODOS PÚBLICOS ADICIONAIS
  // =============================
  async login(email, password) {
    // Mantém a função pública para uso futuro,
    // mas agora o fluxo principal está em handleLoginSubmit.
    return supabase.auth.signInWithPassword({ email, password });
  },

  async logout() {
    await supabase.auth.signOut();
    this.state.user = null;
    this.state.isAuthenticated = false;
    this.state.access = null;
    navigateTo("login.html");
  },
};
