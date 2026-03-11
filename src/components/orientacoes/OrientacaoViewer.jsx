import React from "react";
import { X } from "lucide-react";

const getYouTubeId = (url) => {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

const getCanvaEmbedUrl = (url) => {
  if (!url) return null;
  // Remove trailing slashes and add embed param
  const base = url.replace(/\/$/, "");
  if (base.includes("?")) return base + "&embed";
  return base + "?embed";
};

const getPdfViewerUrl = (url) => {
  if (!url) return null;
  // Google Docs viewer - prevents download
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
};

export default function OrientacaoViewer({ orientacao, onClose }) {
  if (!orientacao) return null;

  const renderContent = () => {
    const url = orientacao.arquivo_url || orientacao.url;

    if (orientacao.tipo === "youtube") {
      const id = getYouTubeId(url);
      if (!id) return <div className="text-white text-center p-8">URL do YouTube inválida</div>;
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={orientacao.titulo}
        />
      );
    }

    if (orientacao.tipo === "canva") {
      const embedUrl = getCanvaEmbedUrl(url);
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          title={orientacao.titulo}
          allow="fullscreen"
        />
      );
    }

    if (orientacao.tipo === "pdf") {
      const viewerUrl = getPdfViewerUrl(url);
      return (
        <iframe
          src={viewerUrl}
          className="w-full h-full"
          title={orientacao.titulo}
          onContextMenu={(e) => e.preventDefault()}
        />
      );
    }

    // documento - fallback
    return (
      <iframe
        src={url}
        className="w-full h-full"
        title={orientacao.titulo}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/60 border-b border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-white font-semibold text-sm truncate max-w-lg">{orientacao.titulo}</h2>
          {orientacao.consultor_nome && (
            <p className="text-xs text-slate-400">por {orientacao.consultor_nome}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - no download */}
      <div className="flex-1 overflow-hidden select-none">
        {renderContent()}
      </div>
    </div>
  );
}