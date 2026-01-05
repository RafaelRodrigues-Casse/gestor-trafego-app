/**
 * Vine Tech App
 * Main JS — MVP Structure
 * Preparado para Auth, Supabase e Dashboard
 */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  state: {
    user: null,
    isAuthenticated: false,
  },

  init() {
    console.log("Vine Tech App iniciado 🚀");

    this.cacheElements();
    this.bindEvents();
    this.render();
  },

  cacheElements() {
    this.header = document.querySelector(".app-header");
    this.main = document.querySelector(".app-main");
    this.footer = document.querySelector(".app-footer");
  },

  bindEvents() {
    // Eventos futuros:
    // login, logout, navegação, botões, etc.
  },

  render() {
    // Renderizações iniciais
    // Ex: verificar autenticação, mostrar módulos, etc.
  },

  // =============================
  // AUTH (FUTURO)
  // =============================
  login() {
    console.log("Login em desenvolvimento");
  },

  logout() {
    console.log("Logout em desenvolvimento");
  },
};
