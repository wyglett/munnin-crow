/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Acompanhamento from './pages/Acompanhamento';
import AdminEditais from './pages/AdminEditais';
import Comunidade from './pages/Comunidade';
import ConsultorDashboard from './pages/ConsultorDashboard';
import Edital from './pages/Edital';
import Home from './pages/Home';
import MinhasPropostas from './pages/MinhasPropostas';
import Orientacoes from './pages/Orientacoes';
import Perfil from './pages/Perfil';
import ProjetoDetalhe from './pages/ProjetoDetalhe';
import PropostaDetalhe from './pages/PropostaDetalhe';
import SobreNos from './pages/SobreNos';
import TiraDuvidas from './pages/TiraDuvidas';
import Planos from './pages/Planos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Acompanhamento": Acompanhamento,
    "AdminEditais": AdminEditais,
    "Comunidade": Comunidade,
    "ConsultorDashboard": ConsultorDashboard,
    "Edital": Edital,
    "Home": Home,
    "MinhasPropostas": MinhasPropostas,
    "Orientacoes": Orientacoes,
    "Perfil": Perfil,
    "ProjetoDetalhe": ProjetoDetalhe,
    "PropostaDetalhe": PropostaDetalhe,
    "SobreNos": SobreNos,
    "TiraDuvidas": TiraDuvidas,
    "Planos": Planos,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};