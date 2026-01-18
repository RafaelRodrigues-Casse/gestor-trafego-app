/**
 * Vine Tech App
 * main.js — Login + Dashboard do Gestor
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
// HELPERS GERAIS
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
// DASHBOARD DO GESTOR – ESTADO E FUNÇÕES
// =============================

// Estado base do Dashboard (depois vamos alimentar com dados reais)
const vineTechDashboardState = {
  companies: 0,        // Empresas / Companies
  entrepreneurs: 0,    // Empreendedores
  activeProjects: 0,   // Ativos em andamento
  activeCampaigns: 0,  // Campanhas ativas
  avgROAS: 0,          // ROAS médio
  avgCPL: 0,           // CPL médio (em R$)
  lastDiagnosis: "",   // Último diagnóstico gerado pela IA
  nextSteps: [],       // Lista de próximos passos recomendados
  accountStatus: {
    active: true,
    planName: "Plano padrão",
    message: "Conta ativa. Você pode trabalhar tranquilo hoje."
  }
};

// Pequeno "banco" de versículos – ACF – para o Versículo Diário
const vineTechVerses = [
  {
    text: "Tudo, porém, seja feito com decência e ordem.",
    ref: "1 Coríntios 14:40 (ACF)"
  },
  {
    text: "Não desprezeis o dia das pequenas coisas.",
    ref: "Zacarias 4:10 (ACF)"
  },
  {
    text: "Mas a vereda dos justos é como a luz da aurora, que vai brilhando mais e mais até ser dia perfeito.",
    ref: "Provérbios 4:18 (ACF)"
  }
];

function vineTechGetDailyVerse() {
  const today = new Date();
  const index = today.getDate() % vineTechVerses.length;
  return vineTechVerses[index];
}

// Inicializa todos os campos do Dashboard
function vineTechDashboardInit() {
  const dashboardEl = document.getElementById("dashboard");
  if (!dashboardEl) {
    // Não está na página que tem o Dashboard (por exemplo, login.html)
    console.log("Dashboard não encontrado nesta página. Pulando inicialização do Dashboard.");
    return;
  }

  console.log("Inicializando Dashboard do Gestor...");

  // Métricas principais
  vineTechSetText("companiesCount", vineTechDashboardState.companies);
  vineTechSetText("entrepreneursCount", vineTechDashboardState.entrepreneurs);

  vineTechSetText("activeProjectsCount", vineTechDashboardState.activeProjects);
  vineTechSetText("activeProjectsCardCount", vineTechDashboardState.activeProjects);

  vineTechSetText("activeCampaignsCount", vineTechDashboardState.activeCampaigns);
  vineTechSetText("avgRoasValue", vineTechFormatNumber(vineTechDashboardState.avgROAS));
  vineTechSetText("avgCplValue", vineTechFormatCurrency(vineTechDashboardState.avgCPL));

  // Último diagnóstico
  if (vineTechDashboardState.lastDiagnosis) {
    vineTechSetText("lastDiagnosisText", vineTechDashboardState.lastDiagnosis);
  }

  // Próximos passos
  const nextStepsList = document.getElementById("nextStepsList");
  if (nextStepsList && vineTechDashboardState.nextSteps.length > 0) {
    nextStepsList.innerHTML = "";
    vineTechDashboardState.nextSteps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      nextStepsList.appendChild(li);
    });
  }

  // Status da conta
  const badge = document.getElementById("accountStatusBadge");
  if (badge) {
    const isActive = vineTechDashboardState.accountStatus.active;
    badge.textContent = isActive ? "Ativo" : "Inativo";
    badge.classList.remove("vt-status-ok", "vt-status-warning");
    badge.classList.add(isActive ? "vt-status-ok" : "vt-status-warning");
  }

  vineTechSetText(
    "accountPlanText",
    `Plano atual: ${vineTechDashboardState.accountStatus.planName}`
  );
  vineTechSetText(
    "accountStatusText",
    vineTechDashboardState.accountStatus.message
  );

  // Versículo diário (ACF)
  const verse = vineTechGetDailyVerse();
  vineTechSetText("dailyVerseText", `“${verse.text}”`);
  vineTechSetText("dailyVerseRef", verse.ref);
}

// Liga os botões do Dashboard (Ações rápidas, Novo Projeto etc.)
function vineTechDashboardWireEvents() {
  const dashboardEl = document.getElementById("dashboard");
  if (!dashboardEl) return; // Segurança

  console.log("Conectando eventos do Dashboard do Gestor...");

  const btnNewProject = document.getElementById("btnNewProject");
  if (btnNewProject) {
    btnNewProject.addEventListener("click", () => {
      // TODO: integrar com fluxo real de criação de projeto
      alert("Novo projeto: em breve este botão abrirá o fluxo de criação de projeto.");
    });
  }

  const btnCloseCampaign = document.getElementById("btnCloseCampaign");
  if (btnCloseCampaign) {
    btnCloseCampaign.addEventListener("click", () => {
      // TODO: integrar com fluxo real de encerramento de campanha
      alert("Encerrar campanha: em breve este botão listará campanhas para encerramento.");
    });
  }

  const btnQuickNewDiagnosis = document.getElementById("btnQuickNewDiagnosis");
  if (btnQuickNewDiagnosis) {
    btnQuickNewDiagnosis.addEventListener("click", () => {
      // Aqui no futuro você chama a IA para gerar diagnóstico
      alert("Novo diagnóstico: ação rápida para abrir a análise de conta.");
    });
  }

  const btnQuickFunnelReview = document.getElementById("btnQuickFunnelReview");
  if (btnQuickFunnelReview) {
    btnQuickFunnelReview.addEventListener("click", () => {
      alert("Revisão por funil: ação rápida para revisar etapa por etapa.");
    });
  }

  const btnQuickOfferOrg = document.getElementById("btnQuickOfferOrg");
  if (btnQuickOfferOrg) {
    btnQuickOfferOrg.addEventListener("click", () => {
      alert("Organização de ofertas: em breve este fluxo ajudará a organizar ofertas.");
    });
  }

  const btnQuickHistory = document.getElementById("btnQuickHistory");
  if (btnQuickHistory) {
    btnQuickHistory.addEventListener("click", () => {
      alert("Histórico de decisões: aqui você verá as últimas decisões tomadas.");
    });
  }
}

// Helpers específicos do Vine Tech (Dashboard)
function vineTechSetText(id, value) {
  const el = document.getElementById(id);
  if (el != null && value != null) {
    el.textContent = value;
  }
}

function vineTechFormatNumber(value) {
  if (value == null) return "0,00";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function vineTechFormatCurrency(value) {
  if (value == null) return "R$ 0,00";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
    console.error(
      "window.supabase está undefined. Verifique a tag <script> do Supabase no HTML."
    );
    return;
  }

  // agora sim criamos o client
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("Supabase client criado:", !!supabaseClient);

  // Inicializa aplicação base (login etc.)
  App.init();

  // Inicializa Dashboard (se o elemento existir na página)
  vineTechDashboardInit();
  vineTechDashboardWireEvents();
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
      console.log("Não é página de login, App.init terminou (modo público / Dashboard).");
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
