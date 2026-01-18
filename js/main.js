/**
 * Vine Tech App
 * main.js — Login + Dashboard do Gestor + Projetos Ativos + Diagnóstico de Campanhas
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
// DASHBOARD DO GESTOR – ESTADO, ESTRUTURA DE PROJETOS E FUNÇÕES
// =============================

// Tipos de cliente
const VINE_TECH_CLIENT_TYPES = {
  COMPANY: "company", // Empresas / Companies
  ENTREPRENEUR: "entrepreneur", // Empreendedores
};

// Status do projeto
const VINE_TECH_PROJECT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
};

// Array de projetos ativos (simulação em memória por enquanto)
// 👉 Depois vamos trocar isso por dados vindos do Supabase.
let vineTechProjects = [
  {
    id: "prj_001",
    clientType: VINE_TECH_CLIENT_TYPES.COMPANY,
    clientName: "Loja Exemplo LTDA",
    brandName: "Loja Exemplo",
    mainOffer: "Lançamento de Coleção Outono",
    niche: "E-commerce de moda",
    platforms: ["facebook_ads", "instagram_ads"],
    status: VINE_TECH_PROJECT_STATUS.ACTIVE,
    budgetMonth: 8000,
    createdAt: "2025-01-10T12:00:00.000Z",
    closedAt: null,
    performance: {
      roas: 3.2,
      cpl: 11.5,
      spend: 6000,
      revenue: 19200,
      leads: 520,
      activeCampaignsCount: 5,
    },
  },
  {
    id: "prj_002",
    clientType: VINE_TECH_CLIENT_TYPES.ENTREPRENEUR,
    clientName: "Rafael – Consultoria Local",
    brandName: "Consultoria Local",
    mainOffer: "Mentoria de Tráfego para Negócios Locais",
    niche: "Serviços locais",
    platforms: ["facebook_ads", "google_ads"],
    status: VINE_TECH_PROJECT_STATUS.ACTIVE,
    budgetMonth: 3000,
    createdAt: "2025-01-15T09:30:00.000Z",
    closedAt: null,
    performance: {
      roas: 2.4,
      cpl: 18.9,
      spend: 2200,
      revenue: 5280,
      leads: 116,
      activeCampaignsCount: 3,
    },
  },
  {
    id: "prj_003",
    clientType: VINE_TECH_CLIENT_TYPES.ENTREPRENEUR,
    clientName: "Maria – Infoprodutora",
    brandName: "Método Social Pro",
    mainOffer: "Treinamento online",
    niche: "Infoproduto",
    platforms: ["instagram_ads"],
    status: VINE_TECH_PROJECT_STATUS.PAUSED,
    budgetMonth: 2000,
    createdAt: "2025-01-05T18:00:00.000Z",
    closedAt: null,
    performance: {
      roas: 0,
      cpl: 0,
      spend: 0,
      revenue: 0,
      leads: 0,
      activeCampaignsCount: 0,
    },
  },
];

// Estado base do Dashboard (alimentado pelos projetos)
const vineTechDashboardState = {
  companies: 0, // Empresas / Companies ativas
  entrepreneurs: 0, // Empreendedores ativos
  activeProjects: 0, // Projetos ativos em andamento
  activeCampaigns: 0, // Campanhas ativas (somatório)
  avgROAS: 0, // ROAS médio
  avgCPL: 0, // CPL médio (em R$)
  lastDiagnosis: "", // Último diagnóstico gerado pela IA
  nextSteps: [], // Lista de próximos passos recomendados
  accountStatus: {
    active: true,
    planName: "Plano padrão",
    message: "Conta ativa. Você pode trabalhar tranquilo hoje.",
  },
};

// Pequeno "banco" de versículos – ACF – para o Versículo Diário
const vineTechVerses = [
  {
    text: "Tudo, porém, seja feito com decência e ordem.",
    ref: "1 Coríntios 14:40 (ACF)",
  },
  {
    text: "Não desprezeis o dia das pequenas coisas.",
    ref: "Zacarias 4:10 (ACF)",
  },
  {
    text: "Mas a vereda dos justos é como a luz da aurora, que vai brilhando mais e mais até ser dia perfeito.",
    ref: "Provérbios 4:18 (ACF)",
  },
];

function vineTechGetDailyVerse() {
  const today = new Date();
  const index = today.getDate() % vineTechVerses.length;
  return vineTechVerses[index];
}

// Recalcula o estado do Dashboard com base nos projetos
function vineTechRecalculateDashboardFromProjects() {
  const activeProjects = vineTechProjects.filter(
    (p) => p.status === VINE_TECH_PROJECT_STATUS.ACTIVE
  );

  vineTechDashboardState.activeProjects = activeProjects.length;

  vineTechDashboardState.companies = activeProjects.filter(
    (p) => p.clientType === VINE_TECH_CLIENT_TYPES.COMPANY
  ).length;

  vineTechDashboardState.entrepreneurs = activeProjects.filter(
    (p) => p.clientType === VINE_TECH_CLIENT_TYPES.ENTREPRENEUR
  ).length;

  vineTechDashboardState.activeCampaigns = activeProjects.reduce(
    (total, p) => total + (p.performance?.activeCampaignsCount || 0),
    0
  );

  // ROAS e CPL médios
  const projectsWithROAS = activeProjects.filter(
    (p) => p.performance && p.performance.roas > 0
  );
  const projectsWithCPL = activeProjects.filter(
    (p) => p.performance && p.performance.cpl > 0
  );

  if (projectsWithROAS.length > 0) {
    const sumROAS = projectsWithROAS.reduce(
      (sum, p) => sum + p.performance.roas,
      0
    );
    vineTechDashboardState.avgROAS = sumROAS / projectsWithROAS.length;
  } else {
    vineTechDashboardState.avgROAS = 0;
  }

  if (projectsWithCPL.length > 0) {
    const sumCPL = projectsWithCPL.reduce(
      (sum, p) => sum + p.performance.cpl,
      0
    );
    vineTechDashboardState.avgCPL = sumCPL / projectsWithCPL.length;
  } else {
    vineTechDashboardState.avgCPL = 0;
  }
}

// Inicializa todos os campos do Dashboard
function vineTechDashboardInit() {
  const dashboardEl = document.getElementById("dashboard");
  if (!dashboardEl) {
    // Não está na página que tem o Dashboard (por exemplo, login.html)
    console.log(
      "Dashboard não encontrado nesta página. Pulando inicialização do Dashboard."
    );
    return;
  }

  console.log("Inicializando Dashboard do Gestor...");

  // 1) recalcula o estado a partir dos projetos
  vineTechRecalculateDashboardFromProjects();

  // 2) aplica no HTML
  vineTechSetText("companiesCount", vineTechDashboardState.companies);
  vineTechSetText("entrepreneursCount", vineTechDashboardState.entrepreneurs);

  vineTechSetText(
    "activeProjectsCount",
    vineTechDashboardState.activeProjects
  );
  vineTechSetText(
    "activeProjectsCardCount",
    vineTechDashboardState.activeProjects
  );

  vineTechSetText(
    "activeCampaignsCount",
    vineTechDashboardState.activeCampaigns
  );
  vineTechSetText(
    "avgRoasValue",
    vineTechFormatNumber(vineTechDashboardState.avgROAS)
  );
  vineTechSetText(
    "avgCplValue",
    vineTechFormatCurrency(vineTechDashboardState.avgCPL)
  );

  // Último diagnóstico
  if (vineTechDashboardState.lastDiagnosis) {
    vineTechSetText("lastDiagnosisText", vineTechDashboardState.lastDiagnosis);
  }

  // Próximos passos
  const nextStepsList = document.getElementById("nextStepsList");
  if (nextStepsList) {
    if (vineTechDashboardState.nextSteps.length > 0) {
      nextStepsList.innerHTML = "";
      vineTechDashboardState.nextSteps.forEach((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        nextStepsList.appendChild(li);
      });
    } else {
      // deixa o texto padrão do HTML se não tiver próximos passos
    }
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
      // TODO: integrar com fluxo real de criação de projeto (ABA 2)
      alert(
        "Novo projeto: em breve este botão abrirá o fluxo de criação de projeto (ABA 2)."
      );
    });
  }

  const btnCloseCampaign = document.getElementById("btnCloseCampaign");
  if (btnCloseCampaign) {
    btnCloseCampaign.addEventListener("click", () => {
      // TODO: integrar com fluxo real de encerramento de campanha
      alert(
        "Encerrar campanha: em breve este botão listará campanhas para encerramento."
      );
    });
  }

  const btnQuickNewDiagnosis = document.getElementById(
    "btnQuickNewDiagnosis"
  );
  if (btnQuickNewDiagnosis) {
    btnQuickNewDiagnosis.addEventListener("click", () => {
      // Aqui no futuro você chama a IA para gerar diagnóstico
      alert("Novo diagnóstico: ação rápida para abrir a análise de conta.");
    });
  }

  const btnQuickFunnelReview = document.getElementById(
    "btnQuickFunnelReview"
  );
  if (btnQuickFunnelReview) {
    btnQuickFunnelReview.addEventListener("click", () => {
      alert("Revisão por funil: ação rápida para revisar etapa por etapa.");
    });
  }

  const btnQuickOfferOrg = document.getElementById("btnQuickOfferOrg");
  if (btnQuickOfferOrg) {
    btnQuickOfferOrg.addEventListener("click", () => {
      alert(
        "Organização de ofertas: em breve este fluxo ajudará a organizar ofertas."
      );
    });
  }

  const btnQuickHistory = document.getElementById("btnQuickHistory");
  if (btnQuickHistory) {
    btnQuickHistory.addEventListener("click", () => {
      alert(
        "Histórico de decisões: aqui você verá as últimas decisões tomadas."
      );
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
// ABA 2 – GESTÃO DE PROJETOS / DIAGNÓSTICO DE CAMPANHAS
// =============================

// Histórico em memória (depois podemos levar para Supabase)
let vineTechDiagnosticsHistory = [];

// Estado temporário do último diagnóstico gerado (IA + gestor)
let vineTechCurrentDiagnosisDraft = null;

function vineTechDiagnosticsInit() {
  const sectionEl = document.getElementById("projectDiagnostics");
  if (!sectionEl) {
    console.log("ABA 2 – projectDiagnostics não encontrado. Pulando init.");
    return;
  }

  console.log("Inicializando ABA 2 – Gestão de Projetos / Diagnóstico...");

  const selectProject = document.getElementById("diagProjectSelect");
  const filesInput = document.getElementById("diagFiles");

  // Preenche combo de projetos com base em vineTechProjects
  if (selectProject) {
    selectProject.innerHTML =
      '<option value="">Selecione um projeto ativo...</option>';

    vineTechProjects.forEach((p) => {
      if (p.status === VINE_TECH_PROJECT_STATUS.ACTIVE) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.brandName} – ${p.clientName}`;
        selectProject.appendChild(opt);
      }
    });
  }

  // Lista de arquivos (prints/criativos)
  if (filesInput) {
    filesInput.addEventListener("change", () => {
      const listEl = document.getElementById("diagFilesList");
      if (!listEl) return;

      const files = Array.from(filesInput.files || []);
      if (files.length === 0) {
        listEl.innerHTML = "<li>Nenhum arquivo selecionado ainda.</li>";
        return;
      }

      listEl.innerHTML = "";
      files.forEach((file) => {
        const li = document.createElement("li");
        li.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        listEl.appendChild(li);
      });
    });
  }

  // Renderiza histórico inicial (se houver)
  vineTechDiagnosticsRenderHistory();
}

function vineTechDiagnosticsWireEvents() {
  const sectionEl = document.getElementById("projectDiagnostics");
  if (!sectionEl) return;

  const selectProject = document.getElementById("diagProjectSelect");
  const btnRunDiagnosis = document.getElementById("btnRunDiagnosis");
  const btnSaveActionPlan = document.getElementById("btnSaveActionPlan");

  if (selectProject) {
    selectProject.addEventListener("change", () => {
      const projectId = selectProject.value;
      const project = vineTechProjects.find((p) => p.id === projectId);
      vineTechDiagnosticsUpdateProjectSummary(project || null);
    });
  }

  if (btnRunDiagnosis) {
    btnRunDiagnosis.addEventListener("click", () => {
      vineTechDiagnosticsHandleRunDiagnosis();
    });
  }

  if (btnSaveActionPlan) {
    btnSaveActionPlan.addEventListener("click", () => {
      vineTechDiagnosticsHandleSavePlan();
    });
  }
}

// Atualiza informações do projeto selecionado
function vineTechDiagnosticsUpdateProjectSummary(project) {
  const clientTypeEl = document.getElementById("diagClientType");
  const statusBadgeEl = document.getElementById("diagProjectStatusBadge");
  const summaryEl = document.getElementById("diagProjectSummary");

  if (!clientTypeEl || !statusBadgeEl || !summaryEl) return;

  if (!project) {
    clientTypeEl.textContent = "—";
    statusBadgeEl.textContent = "—";
    statusBadgeEl.className = "vt-status-badge vt-status-neutral";
    summaryEl.textContent =
      "Selecione um projeto para visualizar o contexto estratégico.";
    return;
  }

  clientTypeEl.textContent =
    project.clientType === VINE_TECH_CLIENT_TYPES.COMPANY
      ? "Empresa / Company"
      : "Empreendedor";

  const statusMap = {
    [VINE_TECH_PROJECT_STATUS.ACTIVE]: {
      text: "Ativo",
      cls: "vt-status-ok",
    },
    [VINE_TECH_PROJECT_STATUS.PAUSED]: {
      text: "Pausado",
      cls: "vt-status-warning",
    },
    [VINE_TECH_PROJECT_STATUS.CLOSED]: {
      text: "Encerrado",
      cls: "vt-status-critical",
    },
  };

  const mapped = statusMap[project.status] || {
    text: "Desconhecido",
    cls: "vt-status-neutral",
  };

  statusBadgeEl.textContent = mapped.text;
  statusBadgeEl.className = `vt-status-badge ${mapped.cls}`;

  const perf = project.performance || {};
  summaryEl.textContent = `
Projeto: ${project.brandName} (${project.clientName}) · 
ROAS: ${perf.roas || 0} · CPL: R$ ${perf.cpl || 0} · Campanhas ativas: ${
    perf.activeCampaignsCount || 0
  }`.trim();
}

// Coleta contexto da tela
function vineTechDiagnosticsGatherContext() {
  const selectProject = document.getElementById("diagProjectSelect");
  const objectiveEl = document.getElementById("diagObjective");
  const goalTypeEl = document.getElementById("diagGoalType");
  const funnelStageEl = document.getElementById("diagFunnelStage");
  const platformEl = document.getElementById("diagPlatform");
  const runningDaysEl = document.getElementById("diagRunningDays");
  const dailyBudgetEl = document.getElementById("diagDailyBudget");

  const projectId = selectProject?.value || "";
  const project = vineTechProjects.find((p) => p.id === projectId) || null;

  return {
    project,
    objective: (objectiveEl?.value || "").trim(),
    goalType: goalTypeEl?.value || "",
    funnelStage: funnelStageEl?.value || "",
    platform: platformEl?.value || "",
    runningDays: Number(runningDaysEl?.value || 0),
    dailyBudget: Number(dailyBudgetEl?.value || 0),
  };
}

// Handler do botão "Solicitar diagnóstico"
function vineTechDiagnosticsHandleRunDiagnosis() {
  const ctx = vineTechDiagnosticsGatherContext();

  if (!ctx.project) {
    alert("Selecione um projeto antes de solicitar o diagnóstico.");
    return;
  }

  if (!ctx.goalType || !ctx.funnelStage || !ctx.platform) {
    alert(
      "Preencha pelo menos o objetivo principal, estágio de funil e plataforma antes de solicitar o diagnóstico."
    );
    return;
  }

  // Aqui entra a "IA" – por enquanto, lógica estratégica de exemplo,
  // depois podemos trocar por chamada a API com modelo de IA real.
  const result = vineTechDiagnosticsRunSimpleAI(ctx);

  vineTechCurrentDiagnosisDraft = result;
  vineTechDiagnosticsApplyResultToUI(result);
}

// Diagnóstico "IA" simples (regra estratégica baseada em dados)
function vineTechDiagnosticsRunSimpleAI(ctx) {
  const project = ctx.project;
  const perf = project.performance || {};
  const roas = perf.roas || 0;
  const cpl = perf.cpl || 0;
  const campaigns = perf.activeCampaignsCount || 0;

  let health = "attention"; // healthy, attention, critical, test
  let healthLabel = "Atenção";
  let healthClass = "vt-status-warning";
  const insights = [];
  const actions = [];

  // Heurísticas simples – depois podemos sofisticar
  if (roas >= 3 && cpl > 0 && cpl <= 15) {
    health = "healthy";
    healthLabel = "Saudável";
    healthClass = "vt-status-ok";
    insights.push(
      "O projeto apresenta bom ROAS e CPL dentro de uma faixa saudável. A prioridade é manter consistência e, se possível, testar escala controlada."
    );
    actions.push(
      "Escalar gradualmente a verba nas campanhas com melhor desempenho.",
      "Registrar público e criativos vencedores para proteção estratégica.",
      "Monitorar diariamente variações bruscas de CPL ou ROAS."
    );
  } else if (roas < 1 || cpl >= 40) {
    health = "critical";
    healthLabel = "Crítico";
    healthClass = "vt-status-critical";
    insights.push(
      "Os indicadores apontam risco financeiro alto. O projeto está em zona crítica e pode estar destruindo margem ou trabalhando no prejuízo."
    );
    actions.push(
      "Pausar de imediato os conjuntos/campanhas com pior desempenho.",
      "Rever promessa, público e oferta antes de seguir investindo.",
      "Redirecionar verba para testes controlados com hipóteses claras."
    );
  } else {
    health = "attention";
    healthLabel = "Atenção";
    healthClass = "vt-status-warning";
    insights.push(
      "O projeto não está em colapso, mas os indicadores não permitem conforto. É necessário ajuste fino antes de pensar em escala."
    );
    actions.push(
      "Analisar criativos individualmente (CTR, CPC, engajamento).",
      "Rever segmentação e alinhamento entre promessa e público.",
      "Ajustar verba diária para proteger o caixa enquanto otimiza."
    );
  }

  if (campaigns === 0) {
    insights.push(
      "Não há campanhas ativas neste projeto. Sem tráfego ativo, não há dados reais para tomada de decisão."
    );
    actions.push(
      "Validar se o projeto está realmente em pausa ou se houve erro operacional.",
      "Criar pelo menos uma campanha de teste alinhada ao objetivo principal."
    );
  }

  if (ctx.runningDays > 0 && ctx.runningDays < 3) {
    insights.push(
      "A campanha está rodando há poucos dias. Qualquer diagnóstico deve ser feito com cautela, priorizando aprendizado, não conclusões definitivas."
    );
  }

  const iaText = `
📌 Diagnóstico do projeto: ${project.brandName}

🎯 Objetivo principal: ${
    ctx.objective || "não informado em detalhes"
  } (${ctx.goalType || "tipo de objetivo não informado"})

📊 Leitura rápida dos indicadores atuais:
- ROAS: ${roas || 0}
- CPL: R$ ${cpl || 0}
- Campanhas ativas: ${campaigns}
- Tempo de veiculação informado: ${ctx.runningDays || 0} dias
- Verba média diária aproximada: R$ ${ctx.dailyBudget || 0}

🧠 Análise estratégica (IA):
- ${insights.join("\n- ")}
`.trim();

  const planText = `
✅ Plano de ação recomendado (IA):

- ${actions.join("\n- ")}

Lembre-se: adapte o plano à realidade do cliente, do nicho e da verba disponível. O Vine Tech foi feito para te dar direção, não para substituir sua responsabilidade como gestor.
`.trim();

  const healthSummary = `
Classificação: ${healthLabel}

Resumo:
${insights.join("\n")}
`.trim();

  return {
    projectId: project.id,
    createdAt: new Date().toISOString(),
    health,
    healthLabel,
    healthClass,
    iaText,
    planText,
    healthSummary,
    context: ctx,
  };
}

// Aplica resultado da "IA" na interface
function vineTechDiagnosticsApplyResultToUI(result) {
  const iaBox = document.getElementById("diagIaResult");
  const planBox = document.getElementById("diagIaPlan");
  const healthBadge = document.getElementById("diagHealthBadge");
  const healthSummaryEl = document.getElementById("diagHealthSummary");

  if (iaBox) {
    iaBox.textContent = "";
    iaBox.innerText = result.iaText;
  }

  if (planBox) {
    planBox.textContent = "";
    planBox.innerText = result.planText;
  }

  if (healthBadge) {
    healthBadge.textContent = result.healthLabel;
    healthBadge.className = `vt-status-badge ${result.healthClass}`;
  }

  if (healthSummaryEl) {
    healthSummaryEl.textContent = result.healthSummary;
  }
}

// Salva plano de ação no histórico
function vineTechDiagnosticsHandleSavePlan() {
  if (!vineTechCurrentDiagnosisDraft) {
    alert(
      "Gere um diagnóstico primeiro antes de salvar o plano de ação no histórico."
    );
    return;
  }

  const notesEl = document.getElementById("diagManagerNotes");
  const notes = (notesEl?.value || "").trim();

  const entry = {
    ...vineTechCurrentDiagnosisDraft,
    managerNotes: notes,
    savedAt: new Date().toISOString(),
  };

  vineTechDiagnosticsHistory.unshift(entry);
  vineTechDiagnosticsRenderHistory();

  alert("Plano de ação salvo no histórico deste navegador (sessão atual).");

  // Opcional: limpar campo de notas
  if (notesEl) {
    notesEl.value = "";
  }
}

// Renderiza histórico na lista
function vineTechDiagnosticsRenderHistory() {
  const listEl = document.getElementById("diagHistoryList");
  if (!listEl) return;

  if (!vineTechDiagnosticsHistory.length) {
    listEl.innerHTML =
      "<li>Nenhum diagnóstico registrado ainda. Salve um plano de ação para iniciar o histórico.</li>";
    return;
  }

  listEl.innerHTML = "";
  vineTechDiagnosticsHistory.forEach((entry) => {
    const li = document.createElement("li");
    const date = new Date(entry.savedAt || entry.createdAt);
    const project =
      vineTechProjects.find((p) => p.id === entry.projectId) || null;

    li.innerHTML = `
<strong>${project ? project.brandName : "Projeto desconhecido"}</strong><br />
<span class="vt-small-text">
  Status: ${entry.healthLabel} · 
  Data: ${date.toLocaleString("pt-BR")}
</span><br />
<span class="vt-small-text">
  Objetivo: ${entry.context.objective || "não informado"}
</span><br />
<span class="vt-small-text">
  Decisão do gestor: ${
    entry.managerNotes || "nenhuma decisão registrada"
  }
</span>
    `.trim();

    li;
    listEl.appendChild(li);
  });
}

// =============================
// APLICAÇÃO
// =============================

document.addEventListener("DOMContentLoaded", () => {
  alert(
    "main.js carregado (Vine Tech v2 + Dashboard + Projetos + Diagnóstico)"
  );
  console.log(
    "main.js carregado (Vine Tech v2 + Dashboard + Projetos + Diagnóstico)"
  );

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

  // ABA 1 – Dashboard
  vineTechDashboardInit();
  vineTechDashboardWireEvents();

  // ABA 2 – Gestão de Projetos / Diagnóstico de Campanhas
  vineTechDiagnosticsInit();
  vineTechDiagnosticsWireEvents();
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
      console.log(
        "Não é página de login, App.init terminou (modo público / Dashboard)."
      );
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

      // 👉 AGORA REDIRECIONA PARA O INDEX (que contém o Dashboard)
      navigateTo("index.html");
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
