/**
 * Vine Tech App
 * Main JS — MVP com Supabase
 * Preparado para Auth, Database e FASE 4
 */

const SUPABASE_URL = "https://yqxylyzizbrhtxsjxqet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_L4npCOhNObMqKRh4u550KA_x3hwoAJT";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", () => {
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
    await this.checkAuth();
    this.render();
  },

  cacheElements() {
    this.header = document.querySelector(".app-header");
    this.main = document.querySelector(".app-main");
    this.footer = document.querySelector(".app-footer");
  },

  async checkAuth() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao verificar autenticação:", error.message);
      return;
    }

    this.state.user = data.user;
    this.state.isAuthenticated = !!data.user;

    console.log("Auth status:", this.state.isAuthenticated);
  },

  render() {
    if (!this.state.isAuthenticated) {
      console.log("Usuário não autenticado");
    } else {
      console.log("Usuário autenticado:", this.state.user.email);
    }
  },

  // =============================
  // AUTH (PRÓXIMAS FASES)
  // =============================
  async login(email, password) {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async logout() {
    await supabase.auth.signOut();
    location.reload();
  },
};
