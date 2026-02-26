import React from "react";
import { Sparkles, Target, Shield, Mail, Phone } from "lucide-react";

export default function SobreNos() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-block mb-6 p-4 rounded-full bg-indigo-500/20 backdrop-blur-sm">
            <Sparkles className="w-12 h-12 text-indigo-300" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Munnin Crow<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Sabedoria & Memória</span>
          </h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed">
            Conectamos empreendedores a oportunidades de fomento, transformando ideias em projetos reais através de inteligência e orientação especializada.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Nossa Missão</h3>
            <p className="text-indigo-200 leading-relaxed">
              Democratizar o acesso a editais de fomento, tornando o processo de criação, análise e submissão de propostas mais acessível e eficiente, especialmente para empreendedores com pouca experiência técnica.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Confidencialidade</h3>
            <p className="text-indigo-200 leading-relaxed">
              Todos os dados inseridos — propostas, documentos e informações pessoais — são protegidos com o mais alto nível de sigilo, conforme a LGPD. Suas ideias estão seguras conosco.
            </p>
          </div>
        </div>

        {/* Origin Story */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-white mb-4">A Origem do Nome</h3>
          <p className="text-indigo-100 leading-relaxed mb-4">
            Na mitologia nórdica, <strong className="text-white">Muninn</strong> (memória) e <strong className="text-white">Huginn</strong> (pensamento) são os dois corvos de Odin, deus da sabedoria. Todos os dias, eles voam pelo mundo trazendo notícias e conhecimento ao seu senhor.
          </p>
          <p className="text-indigo-100 leading-relaxed">
            A <strong className="text-white">Munnin Crow</strong> nasce inspirada nesse conceito: ser a memória e a inteligência que ajudam empreendedores a navegar pelo universo dos editais, transformando oportunidades em projetos reais.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Entre em Contato</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="mailto:contato@munnincrow.com.br" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-all">
                <Mail className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs text-indigo-300">E-mail</p>
                <p className="text-white font-medium">contato@munnincrow.com.br</p>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-xs text-purple-300">Telefone</p>
                <p className="text-white font-medium">(27) 9XXXX-XXXX</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}