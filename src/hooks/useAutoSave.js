import { useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useAutoSave(usuario_email, tipo_conteudo, formData, entidade_id = null, intervalo = 10000) {
  const salvarRascunho = useCallback(async () => {
    if (!usuario_email || !formData || Object.keys(formData).length === 0) return;

    try {
      const titulo = formData.titulo || formData.nome || "Rascunho";
      const rascunhos = await base44.entities.RascunhoAutoSave.filter({
        usuario_email,
        tipo_conteudo,
        entidade_id,
      });

      if (rascunhos.length > 0) {
        await base44.entities.RascunhoAutoSave.update(rascunhos[0].id, {
          dados_formulario: formData,
          titulo,
          ultima_atualizacao: new Date().toISOString(),
          versao: (rascunhos[0].versao || 0) + 1,
        });
      } else {
        await base44.entities.RascunhoAutoSave.create({
          usuario_email,
          tipo_conteudo,
          entidade_id,
          titulo,
          dados_formulario: formData,
          ultima_atualizacao: new Date().toISOString(),
          versao: 1,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
    }
  }, [usuario_email, tipo_conteudo, formData, entidade_id]);

  useEffect(() => {
    const timer = setInterval(salvarRascunho, intervalo);
    return () => clearInterval(timer);
  }, [salvarRascunho, intervalo]);
}

export async function recuperarRascunho(usuario_email, tipo_conteudo, entidade_id = null) {
  try {
    const rascunhos = await base44.entities.RascunhoAutoSave.filter({
      usuario_email,
      tipo_conteudo,
      entidade_id,
    });

    if (rascunhos.length > 0) {
      return rascunhos[0];
    }
    return null;
  } catch (error) {
    console.error("Erro ao recuperar rascunho:", error);
    return null;
  }
}

export async function limparRascunho(usuario_email, tipo_conteudo, entidade_id = null) {
  try {
    const rascunhos = await base44.entities.RascunhoAutoSave.filter({
      usuario_email,
      tipo_conteudo,
      entidade_id,
    });

    if (rascunhos.length > 0) {
      await base44.entities.RascunhoAutoSave.delete(rascunhos[0].id);
    }
  } catch (error) {
    console.error("Erro ao limpar rascunho:", error);
  }
}