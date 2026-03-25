import React, { useState } from "react";
import { Settings, FileText, BarChart3, Bell, BookOpen, Users, Zap } from "lucide-react";
import ModelosDocumentoAdmin from "@/components/admin/ModelosDocumentoAdmin";
import AdminRevenueTabV2 from "@/components/admin/AdminRevenueTabV2";
import NotificarUsuariosAdminV2 from "@/components/admin/NotificarUsuariosAdminV2";
import ConversaAdminIAV2 from "@/components/admin/ConversaAdminIAV2";

const MENU_ITEMS = [
  { id: "documentos", icon: FileText, label: "Modelos de Documentos", color: "bg-blue-100 text-blue-600" },
  { id: "financeiro", icon: BarChart3, label: "Financeiro & Receitas", color: "bg-green-100 text-green-600" },
  { id: "notificacoes", icon: Bell, label: "Notificações", color: "bg-yellow-100 text-yellow-600" },
  { id: "ia-feedback", icon: Zap, label: "IA & Feedback", color: "bg-purple-100 text-purple-600" },
];

export default function AdminV2() {
  const [activeTab, setActiveTab] = useState("documentos");

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Administração</h2>
              <p className="text-xs text-slate-500">Painel de controle</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Sistema de administração v2.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                {MENU_ITEMS.find(m => m.id === activeTab)?.label}
              </h1>
              <p className="text-slate-600 mt-1">
                Gerencie as configurações e recursos da plataforma
              </p>
            </div>

            {/* Content Sections */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              {activeTab === "documentos" && <ModelosDocumentoAdmin />}
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