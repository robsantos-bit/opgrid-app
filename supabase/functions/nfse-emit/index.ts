import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NfseRequest {
  // Dados do prestador (empresa)
  prestador: {
    cnpj: string;
    inscricao_municipal: string;
    razao_social: string;
    codigo_municipio: string; // Taubaté = 3554102
    regime_tributario: string;
  };
  // Dados do tomador (cliente)
  tomador: {
    cpf_cnpj: string;
    razao_social: string;
    endereco?: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
    email?: string;
  };
  // Dados do serviço
  servico: {
    codigo_servico: string; // Ex: 14.01
    discriminacao: string;
    valor: number;
    aliquota_iss: number;
  };
  // Referência interna
  atendimento_id?: string;
  ambiente?: "homologacao" | "producao";
}

// Monta XML ABRASF 2.04 (padrão MeuMunicipio.Digital / Taubaté)
function buildEnviarLoteRpsXml(data: NfseRequest, rpsNumero: number): string {
  const now = new Date();
  const dataEmissao = now.toISOString().split("T")[0];
  const competencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const valorServico = data.servico.valor.toFixed(2);
  const valorIss = (data.servico.valor * (data.servico.aliquota_iss / 100)).toFixed(2);
  const aliquota = (data.servico.aliquota_iss / 100).toFixed(4);

  const isCnpj = data.tomador.cpf_cnpj.replace(/\D/g, "").length > 11;
  const tomadorDocTag = isCnpj
    ? `<Cnpj>${data.tomador.cpf_cnpj.replace(/\D/g, "")}</Cnpj>`
    : `<Cpf>${data.tomador.cpf_cnpj.replace(/\D/g, "")}</Cpf>`;

  const enderecoXml = data.tomador.endereco
    ? `<Endereco>
        <Logradouro>${data.tomador.endereco.logradouro}</Logradouro>
        <Numero>${data.tomador.endereco.numero}</Numero>
        <Bairro>${data.tomador.endereco.bairro}</Bairro>
        <CodigoMunicipio>${data.prestador.codigo_municipio}</CodigoMunicipio>
        <Uf>${data.tomador.endereco.uf}</Uf>
        <Cep>${data.tomador.endereco.cep.replace(/\D/g, "")}</Cep>
      </Endereco>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="lote_${rpsNumero}" versao="2.04">
    <NumeroLote>${rpsNumero}</NumeroLote>
    <CpfCnpj>
      <Cnpj>${data.prestador.cnpj.replace(/\D/g, "")}</Cnpj>
    </CpfCnpj>
    <InscricaoMunicipal>${data.prestador.inscricao_municipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfDeclaracaoPrestacaoServico Id="rps_${rpsNumero}">
          <Rps>
            <IdentificacaoRps>
              <Numero>${rpsNumero}</Numero>
              <Serie>OPGRID</Serie>
              <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${dataEmissao}</DataEmissao>
            <Status>1</Status>
          </Rps>
          <Competencia>${competencia}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${valorServico}</ValorServicos>
              <ValorDeducoes>0.00</ValorDeducoes>
              <ValorPis>0.00</ValorPis>
              <ValorCofins>0.00</ValorCofins>
              <ValorInss>0.00</ValorInss>
              <ValorIr>0.00</ValorIr>
              <ValorCsll>0.00</ValorCsll>
              <IssRetido>2</IssRetido>
              <ValorIss>${valorIss}</ValorIss>
              <Aliquota>${aliquota}</Aliquota>
              <DescontoIncondicionado>0.00</DescontoIncondicionado>
              <DescontoCondicionado>0.00</DescontoCondicionado>
            </Valores>
            <ItemListaServico>${data.servico.codigo_servico.replace(".", "")}</ItemListaServico>
            <CodigoTributacaoMunicipio>${data.servico.codigo_servico.replace(".", "")}</CodigoTributacaoMunicipio>
            <Discriminacao>${data.servico.discriminacao}</Discriminacao>
            <CodigoMunicipio>${data.prestador.codigo_municipio}</CodigoMunicipio>
            <ExigibilidadeISS>1</ExigibilidadeISS>
            <MunicipioIncidencia>${data.prestador.codigo_municipio}</MunicipioIncidencia>
          </Servico>
          <Prestador>
            <CpfCnpj>
              <Cnpj>${data.prestador.cnpj.replace(/\D/g, "")}</Cnpj>
            </CpfCnpj>
            <InscricaoMunicipal>${data.prestador.inscricao_municipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                ${tomadorDocTag}
              </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${data.tomador.razao_social}</RazaoSocial>
            ${enderecoXml}
            ${data.tomador.email ? `<Contato><Email>${data.tomador.email}</Email></Contato>` : ""}
          </Tomador>
          <OptanteSimplesNacional>${data.prestador.regime_tributario === "simples" ? 1 : 2}</OptanteSimplesNacional>
          <IncentivoFiscal>2</IncentivoFiscal>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const NFSE_LOGIN = Deno.env.get("NFSE_LOGIN"); // Login do portal MeuMunicipio
    const NFSE_SENHA = Deno.env.get("NFSE_SENHA"); // Senha do portal
    const NFSE_API_KEY = Deno.env.get("NFSE_API_KEY"); // API Key eNotas (alternativa)
    const NFSE_EMPRESA_ID = Deno.env.get("NFSE_EMPRESA_ID"); // ID empresa eNotas

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body: NfseRequest = await req.json();
    const ambiente = body.ambiente || "homologacao";

    // Validações básicas
    if (!body.prestador?.cnpj || !body.tomador?.cpf_cnpj || !body.servico?.valor) {
      return new Response(
        JSON.stringify({ error: "Dados obrigatórios ausentes: prestador.cnpj, tomador.cpf_cnpj, servico.valor" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar número RPS sequencial
    const rpsNumero = Date.now() % 1000000;

    let resultado: Record<string, unknown>;

    // ===== MODO 1: eNotas Gateway (API REST) =====
    if (NFSE_API_KEY && NFSE_EMPRESA_ID) {
      const enotasBase = ambiente === "producao"
        ? "https://api.enotas.com.br/v2"
        : "https://api.enotas.com.br/v2";

      const nfsePayload = {
        tipo: "NFS-e",
        idExterno: `opgrid-${rpsNumero}`,
        ambienteEmissao: ambiente === "producao" ? "producao" : "homologacao",
        enviarPorEmail: true,
        cliente: {
          tipoPessoa: body.tomador.cpf_cnpj.replace(/\D/g, "").length > 11 ? "J" : "F",
          nome: body.tomador.razao_social,
          cpfCnpj: body.tomador.cpf_cnpj.replace(/\D/g, ""),
          email: body.tomador.email || "",
          endereco: body.tomador.endereco
            ? {
                logradouro: body.tomador.endereco.logradouro,
                numero: body.tomador.endereco.numero,
                bairro: body.tomador.endereco.bairro,
                cidade: body.tomador.endereco.cidade,
                uf: body.tomador.endereco.uf,
                cep: body.tomador.endereco.cep.replace(/\D/g, ""),
              }
            : undefined,
        },
        servico: {
          descricao: body.servico.discriminacao,
          aliquotaIss: body.servico.aliquota_iss,
          issRetidoFonte: false,
          codigoServicoMunicipio: body.servico.codigo_servico.replace(".", ""),
          itemListaServicoLC116: body.servico.codigo_servico,
          valorServicos: body.servico.valor,
        },
      };

      const resp = await fetch(
        `${enotasBase}/empresas/${NFSE_EMPRESA_ID}/nfes`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${NFSE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nfsePayload),
        }
      );

      const respBody = await resp.text();
      if (!resp.ok) {
        console.error("eNotas error:", resp.status, respBody);
        return new Response(
          JSON.stringify({ error: `eNotas retornou ${resp.status}`, details: respBody }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      resultado = JSON.parse(respBody);
    }
    // ===== MODO 2: ABRASF WebService (MeuMunicipio.Digital / Taubaté) =====
    else if (NFSE_LOGIN && NFSE_SENHA) {
      // URL do WebService ABRASF de Taubaté
      const wsUrl = ambiente === "producao"
        ? "https://taubateiss.meumunicipio.digital/nfseserv/webservice/nfse"
        : "https://taubateiss.meumunicipio.digital/nfseserv/webservice/nfse?homologacao=true";

      const xmlBody = buildEnviarLoteRpsXml(body, rpsNumero);

      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:nfse="http://www.abrasf.org.br/nfse.xsd">
  <soapenv:Header>
    <auth>
      <usuario>${NFSE_LOGIN}</usuario>
      <senha>${NFSE_SENHA}</senha>
    </auth>
  </soapenv:Header>
  <soapenv:Body>
    <nfse:RecepcionarLoteRps>
      <nfseCabecMsg>
        <![CDATA[<?xml version="1.0" encoding="UTF-8"?>
        <cabecalho xmlns="http://www.abrasf.org.br/nfse.xsd" versao="2.04">
          <versaoDados>2.04</versaoDados>
        </cabecalho>]]>
      </nfseCabecMsg>
      <nfseDadosMsg>
        <![CDATA[${xmlBody}]]>
      </nfseDadosMsg>
    </nfse:RecepcionarLoteRps>
  </soapenv:Body>
</soapenv:Envelope>`;

      const resp = await fetch(wsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "RecepcionarLoteRps",
        },
        body: soapEnvelope,
      });

      const respBody = await resp.text();
      if (!resp.ok) {
        console.error("ABRASF WS error:", resp.status, respBody);
        return new Response(
          JSON.stringify({ error: `WebService retornou ${resp.status}`, details: respBody }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse basic response
      const protocolo = respBody.match(/<Protocolo>(.*?)<\/Protocolo>/)?.[1] || null;
      const numNfse = respBody.match(/<Numero>(.*?)<\/Numero>/)?.[1] || null;
      const erroMsg = respBody.match(/<Mensagem>(.*?)<\/Mensagem>/)?.[1] || null;

      if (erroMsg && !protocolo) {
        return new Response(
          JSON.stringify({ error: "Prefeitura retornou erro", mensagem: erroMsg, xml: respBody }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      resultado = {
        provedor: "abrasf_taubate",
        protocolo,
        numero_nfse: numNfse,
        status: protocolo ? "processando" : "emitida",
        xml_resposta: respBody,
      };
    } else {
      return new Response(
        JSON.stringify({
          error: "Nenhum provedor configurado. Configure NFSE_API_KEY + NFSE_EMPRESA_ID (eNotas) ou NFSE_LOGIN + NFSE_SENHA (ABRASF/Taubaté).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar registro no banco
    const { error: dbError } = await supabase.from("nfse_emitidas").insert({
      atendimento_id: body.atendimento_id || null,
      prestador_cnpj: body.prestador.cnpj.replace(/\D/g, ""),
      tomador_doc: body.tomador.cpf_cnpj.replace(/\D/g, ""),
      tomador_nome: body.tomador.razao_social,
      valor: body.servico.valor,
      aliquota_iss: body.servico.aliquota_iss,
      codigo_servico: body.servico.codigo_servico,
      discriminacao: body.servico.discriminacao,
      numero_rps: rpsNumero,
      numero_nfse: (resultado as any).numero_nfse || (resultado as any).nfeId || null,
      protocolo: (resultado as any).protocolo || null,
      status: (resultado as any).status || "emitida",
      ambiente,
      provedor: NFSE_API_KEY ? "enotas" : "abrasf_taubate",
      resposta_json: resultado,
    });

    if (dbError) {
      console.warn("Nota emitida mas falhou ao salvar no DB:", dbError.message);
    }

    return new Response(
      JSON.stringify({ success: true, data: resultado }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("nfse-emit error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
