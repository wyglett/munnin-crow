import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp } from "lucide-react";

const COLORS = ["#4f46e5", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    editaisPorEstado: [],
    editaisPorCategoria: [],
    usuariosPorPerfil: [],
    totalEditais: 0,
    totalUsuarios: 0,
    totalNotificacoes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [editais, usuarios] = await Promise.all([
          base44.entities.Edital.list(),
          base44.entities.User.list(),
        ]);

        // Editais por estado
        const estadosMap = {};
        editais.forEach(e => {
          const estado = e.estado || "Indefinido";
          estadosMap[estado] = (estadosMap[estado] || 0) + 1;
        });
        const editaisPorEstado = Object.entries(estadosMap)
          .map(([estado, count]) => ({ estado, count }))
          .sort((a, b) => b.count - a.count);

        // Editais por categoria
        const categoriasMap = {};
        editais.forEach(e => {
          const cat = e.categoria || "Outro";
          categoriasMap[cat] = (categoriasMap[cat] || 0) + 1;
        });
        const editaisPorCategoria = Object.entries(categoriasMap)
          .map(([nome, value]) => ({ name: nome, value }))
          .sort((a, b) => b.value - a.value);

        // Usuários por perfil
        const perfilMap = {};
        usuarios.forEach(u => {
          const perfil = u.tipo_usuario || u.role || "Indefinido";
          perfilMap[perfil] = (perfilMap[perfil] || 0) + 1;
        });
        const usuariosPorPerfil = Object.entries(perfilMap)
          .map(([perfil, count]) => ({ perfil, count }))
          .sort((a, b) => b.count - a.count);

        setStats({
          editaisPorEstado,
          editaisPorCategoria,
          usuariosPorPerfil,
          totalEditais: editais.length,
          totalUsuarios: usuarios.length,
          totalNotificacoes: 0,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50/80 border border-red-200/60 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-900">Erro ao carregar dados</p>
          <p className="text-xs text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/60 bg-white/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Editais</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalEditais}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Usuários</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalUsuarios}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Estados</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.editaisPorEstado.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editais por Estado */}
        <Card className="border-slate-200/60 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 text-base">Editais por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.editaisPorEstado} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="estado" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "#ffffff" }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Editais por Categoria */}
        <Card className="border-slate-200/60 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 text-base">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.editaisPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.editaisPorCategoria.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "#ffffff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Usuários por Perfil */}
        <Card className="border-slate-200/60 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-900 text-base">Usuários Cadastrados por Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.usuariosPorPerfil} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="perfil" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "#ffffff" }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}