import React from "react";

export default function SobreNos() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sobre a Munnin Crow</h1>
        <p className="text-gray-500 mb-8">Sabedoria e Memória ao seu alcance</p>

        <div className="prose prose-gray max-w-none">
          <h2>O Nome</h2>
          <p>Na mitologia nórdica, <strong>Muninn</strong> (memória) e <strong>Huginn</strong> (pensamento) são os dois corvos que acompanham Odin, o deus da sabedoria. Todos os dias, eles voam pelo mundo para trazer ao seu senhor notícias e conhecimento.</p>
          <p>A <strong>Munnin Crow</strong> nasce inspirada nesse conceito: ser a memória e a inteligência que ajudam empreendedores a navegar pelo complexo universo dos editais de fomento, transformando oportunidades em projetos reais.</p>

          <h2>Nossa Missão</h2>
          <p>Democratizar o acesso a editais de fomento, tornando o processo de criação, análise e submissão de propostas mais acessível e eficiente, especialmente para empreendedores individuais com pouca experiência técnica.</p>

          <h2>Termos de Confidencialidade e Sigilo</h2>
          <p>A Munnin Crow se compromete com a proteção e confidencialidade das informações dos seus usuários. Todos os dados inseridos na plataforma — incluindo propostas, documentos e informações pessoais — são tratados com o mais alto nível de sigilo.</p>
          <ul>
            <li>Dados pessoais são protegidos conforme a LGPD (Lei Geral de Proteção de Dados)</li>
            <li>Propostas e documentos são acessíveis apenas ao usuário que os criou</li>
            <li>Nenhum conteúdo é compartilhado com terceiros sem autorização expressa</li>
            <li>Dados de análise da IA não são utilizados para fins além do serviço contratado</li>
          </ul>

          <h2>Contato</h2>
          <p>Para dúvidas, sugestões ou parcerias:</p>
          <ul>
            <li>E-mail: contato@munnincrow.com.br</li>
            <li>Telefone: (27) 9XXXX-XXXX</li>
          </ul>
        </div>
      </div>
    </div>
  );
}