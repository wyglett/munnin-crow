import React, { useState } from "react";
import { Settings, FileText, BarChart3, Bell, Users, Zap } from "lucide-react";
import ModelosUnificadoAdmin from "@/components/admin/ModelosUnificadoAdmin";
import AdminRevenueTabV2 from "@/components/admin/AdminRevenueTabV2";
import NotificarUsuariosAdminV2 from "@/components/admin/NotificarUsuariosAdminV2";
import ConversaAdminIAV2 from "@/components/admin/ConversaAdminIAV2";
import UsuariosAdmin from "@/components/admin/UsuariosAdmin";

const MENU_ITEMS = [
  { id: "modelos", icon: FileText, label: "Modelos" },
  { id: "usuarios", icon: Users, label: "Usuários" },
  { id: "financeiro", icon: BarChart3, label: "Financeiro & Receitas" },
  { id: "notificacoes", icon: Bell, label: "Notificações" },
  { id: "ia-feedback", icon: Zap, label: "IA & Feedback" },
];

export default function AdminV2() {
  const [activeTab, setActiveTab] = useState("modelos");

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col border-r border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/50">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Administração</h2>
              <p className="text-xs text-slate-400">Painel de controle</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Admin v2.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                {MENU_ITEMS.find(m => m.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 mt-2">
                {activeTab === "modelos" && "Gerencie propostas e relatórios"}
                {activeTab === "usuarios" && "Gerencie usuários da plataforma"}
                {activeTab === "financeiro" && "Acompanhe receitas e financeiro"}
                {activeTab === "notificacoes" && "Envie notificações aos usuários"}
                {activeTab === "ia-feedback" && "Monitore e melhore a IA"}
              </p>
            </div>

            {/* Content Sections */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              {activeTab === "modelos" && <ModelosUnificadoAdmin />}
              {activeTab === "usuarios" && <UsuariosAdmin />}
              {activeTab === "financeiro" && <AdminRevenueTabV2 />}
              {activeTab === "notificacoes" && <NotificarUsuariosAdminV2 />}
              {activeTab === "ia-feedback" && <ConversaAdminIAV2 />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}