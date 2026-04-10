import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { placa } = await req.json();
    const clean = (placa || "").replace(/[-\s]/g, "").toUpperCase();

    if (clean.length < 7) {
      return new Response(JSON.stringify({ erro: "Placa inválida. Informe no formato ABC1234 ou ABC1D23." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("API_PLACAS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ erro: "API_PLACAS_TOKEN não configurado." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consulta ApiPlacas (wdapi2)
    const apiUrl = `https://wdapi2.com.br/consulta/${clean}/${token}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`ApiPlacas HTTP ${response.status}`);
      return new Response(JSON.stringify({ erro: "Falha na consulta. Tente novamente.", encontrado: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // ApiPlacas retorna erro no campo "erro" ou "message"
    if (data.erro || data.error || data.message) {
      return new Response(JSON.stringify({ encontrado: false, mensagem: data.erro || data.message || "Placa não encontrada." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrai dados do veículo
    const resultado = {
      encontrado: true,
      marca: data.MARCA || data.marca || "",
      modelo: data.MODELO || data.modelo || "",
      cor: data.cor || data.COR || "",
      ano: data.ano || data.ANO || "",
      anoModelo: data.anoModelo || data.ano_modelo || "",
      combustivel: data.combustivel || "",
      municipio: data.municipio || data.extra?.municipio || "",
      uf: data.uf || data.extra?.uf || "",
      placa: clean,
    };

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("lookup-placa error:", e);
    return new Response(JSON.stringify({ erro: e.message, encontrado: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
