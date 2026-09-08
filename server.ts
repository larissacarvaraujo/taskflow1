import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { generateInviteEmailHtml, generateInviteEmailText } from "./server/emailTemplates";

dotenv.config();

const app = express();
const PORT = 3000;

// In-memory store for invitations and workspaces
const storedInvites = new Map<string, any>();

// Allow large payloads for base64 PDF uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// PDF Parsing endpoint using Gemini 3.8 Flash
app.post("/api/parse-pdf", async (req, res) => {
  try {
    const { pdfBase64, textContent, fileName } = req.body;

    if (!pdfBase64 && !textContent) {
      return res.status(400).json({
        error: "Nenhum arquivo PDF ou conteúdo de texto foi fornecido para importação.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if API key is not configured or in sandbox without key
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Using fallback task generation.");
      return res.json({
        success: true,
        isFallback: true,
        projectName: fileName ? `Projeto extraído: ${fileName.replace(/\.pdf$/i, "")}` : "Projeto Importado",
        projectSummary: "Tarefas geradas automaticamente com base no documento.",
        tasks: [
          {
            title: "Mapear requisitos do documento PDF",
            description: "Revisar diretrizes e escopo extraídos do arquivo importado.",
            priority: "alta",
            column: "todo",
            estimatedHours: 4,
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
            subtasks: ["Ler seções principais", "Validar responsáveis", "Definir marcos"],
            tags: ["Planejamento", "PDF"],
            suggestedAssignee: "Graciele Silva",
          },
          {
            title: "Desenvolver protótipo das entregas",
            description: "Criar a estrutura base descrita no cronograma do PDF.",
            priority: "media",
            column: "todo",
            estimatedHours: 8,
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
            subtasks: ["Design preliminar", "Configuração técnica"],
            tags: ["Execução"],
            suggestedAssignee: "Lucas Mendes",
          },
          {
            title: "Validação final e entrega com cliente",
            description: "Apresentar resultados e fechar pendências do projeto.",
            priority: "urgente",
            column: "review",
            estimatedHours: 3,
            dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0],
            subtasks: ["Checklist de homologação", "Assinatura de aceite"],
            tags: ["Aprovação"],
            suggestedAssignee: "Ana Souza",
          },
        ],
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const promptInstructions = `Você é um especialista em gestão ágil de projetos (Kanban/Trello/Runrun.it).
Analise o documento PDF fornecido e extraia uma lista completa e estruturada de tarefas do projeto para organizar no quadro.
Extraia detalhes realistas:
- projectName: nome do projeto ou assunto principal do documento
- projectSummary: breve resumo do escopo em 1 ou 2 frases
- tasks: lista de tarefas práticas necessárias para executar o escopo identificado:
  - title: título acionável e objetivo (ex: 'Configurar banco de dados', 'Elaborar wireframes do checkout')
  - description: descrição detalhada explicando o que deve ser feito com base no documento
  - priority: 'baixa', 'media', 'alta' ou 'urgente'
  - column: coluna kanban sugerida ('todo', 'in_progress' ou 'review')
  - estimatedHours: estimativa realista de horas (número inteiro entre 1 e 40)
  - dueDate: data limite aproximada no formato YYYY-MM-DD (considere prazos citados ou projete datas plausíveis a partir de hoje: ${new Date().toISOString().split("T")[0]})
  - subtasks: lista de 2 a 5 subtarefas ou passos de checklist práticos
  - tags: 1 a 3 tags/categorias (ex: 'Backend', 'Design', 'Operações', 'Financeiro', 'Qualidade')
  - suggestedAssignee: papel ou nome sugerido para direcionar a tarefa (ex: 'Desenvolvedor Frontend', 'Designer UX', 'Gerente de Projetos', 'Analista de QA')
`;

    let contentsPayload: any[];

    if (pdfBase64) {
      // Remove data URL prefix if present
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      contentsPayload = [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64,
          },
        },
        {
          text: promptInstructions,
        },
      ];
    } else {
      contentsPayload = [
        {
          text: `${promptInstructions}\n\nConteúdo do documento:\n${textContent}`,
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contentsPayload,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            projectSummary: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    enum: ["baixa", "media", "alta", "urgente"],
                  },
                  column: {
                    type: Type.STRING,
                    enum: ["todo", "in_progress", "review"],
                  },
                  estimatedHours: { type: Type.NUMBER },
                  dueDate: { type: Type.STRING },
                  subtasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  suggestedAssignee: { type: Type.STRING },
                },
                required: [
                  "title",
                  "description",
                  "priority",
                  "column",
                  "subtasks",
                  "tags",
                ],
              },
            },
          },
          required: ["projectName", "tasks"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      ...parsedJson,
    });
  } catch (error: any) {
    console.error("Erro ao analisar documento:", error);
    return res.status(500).json({
      error: "Falha ao processar o arquivo PDF.",
      details: error.message || String(error),
    });
  }
});

// Priority Suggestion endpoint using Gemini 3.8 Flash
app.post("/api/suggest-priority", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        error: "Forneça pelo menos o título ou a descrição da tarefa para análise da prioridade.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Using heuristic priority estimation.");
      const combined = `${title || ""} ${description || ""}`.toLowerCase();
      let priority = "media";
      let reason = "Prioridade estimada com base no escopo e termos identificados.";

      if (
        combined.includes("urgente") ||
        combined.includes("critico") ||
        combined.includes("crítico") ||
        combined.includes("fora do ar") ||
        combined.includes("crash") ||
        combined.includes("bloqueio") ||
        combined.includes("segurança") ||
        combined.includes("pagamento")
      ) {
        priority = "urgente";
        reason = "Detectado impacto crítico ou bloqueio operacional grave.";
      } else if (
        combined.includes("bug") ||
        combined.includes("erro") ||
        combined.includes("falha") ||
        combined.includes("cliente") ||
        combined.includes("entrega") ||
        combined.includes("importante")
      ) {
        priority = "alta";
        reason = "A tarefa envolve correção relevante ou entrega de alto valor.";
      } else if (
        combined.includes("melhoria") ||
        combined.includes("estudo") ||
        combined.includes("documentação") ||
        combined.includes("documentacao") ||
        combined.includes("opcional") ||
        combined.includes("ideia")
      ) {
        priority = "baixa";
        reason = "Tarefa de aprimoramento contínuo ou documentação sem prazo crítico.";
      }

      return res.json({
        success: true,
        priority,
        reason,
        isFallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `Você é um especialista em gestão ágil de projetos (Kanban, Scrum, Trello, Runrun.it).
Analise as informações desta tarefa e recomende o nível de prioridade mais apropriado entre:
- 'urgente': Incidente crítico em produção, falhas graves de segurança, bloqueio de pagamentos ou prazos imediatos que paralisam a equipe ou clientes.
- 'alta': Funcionalidades centrais essenciais, correção de bugs relevantes, entregas estratégicas ou dependências diretas de outros times.
- 'media': Tarefas padrão do sprint/dia a dia, melhorias necessárias com cronograma regular, testes e rotinas de desenvolvimento.
- 'baixa': Ajustes estéticos secundários, documentação não urgente, pesquisa exploratória ou ideias futuras sem prazo apertado.

Título da tarefa: "${title || "(sem título explícito)"}"
Descrição da tarefa: "${description || "(sem descrição adicional)"}"

Retorne uma justificativa clara, concisa e amigável em português (1 frase) explicando objetivamente por que essa prioridade foi escolhida.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              enum: ["baixa", "media", "alta", "urgente"],
              description: "Nível de prioridade recomendado para a tarefa.",
            },
            reason: {
              type: Type.STRING,
              description: "Justificativa curta em português explicando a decisão.",
            },
          },
          required: ["priority", "reason"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      priority: parsedJson.priority || "media",
      reason: parsedJson.reason || "Prioridade avaliada com sucesso pela IA.",
    });
  } catch (error: any) {
    console.error("Erro ao sugerir prioridade com Gemini:", error);
    return res.status(500).json({
      error: "Falha ao analisar a prioridade com IA.",
      details: error.message || String(error),
    });
  }
});

// ==========================================
// Collaborator Email Invitation Endpoints
// ==========================================

// Check Resend / Email configuration status
app.get("/api/invites/config", (req, res) => {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const resendFrom = process.env.RESEND_FROM || "TaskFlow <onboarding@resend.dev>";
  const smtpHost = (process.env.SMTP_HOST || "").trim();
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || "").trim();

  const hasResend = resendApiKey.length > 0;
  const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);

  const activeProvider = hasResend ? "resend" : hasSmtp ? "smtp" : "none";

  const maskedKey = hasResend
    ? resendApiKey.length > 8
      ? `${resendApiKey.slice(0, 5)}...${resendApiKey.slice(-4)}`
      : "Configurada"
    : null;

  return res.json({
    configured: hasResend || hasSmtp,
    activeProvider,
    resend: {
      isConfigured: hasResend,
      maskedKey,
      sender: resendFrom,
      isTestDomain: !process.env.RESEND_FROM || resendFrom.includes("onboarding@resend.dev"),
    },
    smtp: {
      isConfigured: hasSmtp,
      host: smtpHost || null,
      user: smtpUser || null,
    },
  });
});

// Test Resend API connection directly
app.post("/api/invites/test-resend", async (req, res) => {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const resendFrom = process.env.RESEND_FROM || "TaskFlow <onboarding@resend.dev>";
  const { testEmail } = req.body;

  if (!resendApiKey) {
    return res.status(400).json({
      success: false,
      error: "RESEND_API_KEY não foi detectada no ambiente. Adicione a chave nas Configurações da aplicação.",
    });
  }

  if (!testEmail || !testEmail.includes("@")) {
    return res.status(400).json({
      success: false,
      error: "Informe um e-mail válido para disparar o teste.",
    });
  }

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [testEmail],
        subject: "Teste de Conexão Resend - TaskFlow",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
            <div style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-bottom: 16px;">
              TaskFlow
            </div>
            <h2 style="font-size: 20px; font-weight: bold; color: #1e1b4b; margin: 0 0 12px;">Conexão com Resend Ativa e Funcionando! 🎉</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
              Este é um e-mail de teste confirmando que a sua <strong>RESEND_API_KEY</strong> está configurada corretamente e o TaskFlow está pronto para enviar convites para seus colaboradores automaticamente em segundo plano.
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569; margin-bottom: 16px;">
              <strong>Remetente ativo:</strong> ${resendFrom}<br />
              <strong>Destinatário verificado:</strong> ${testEmail}
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              TaskFlow • Gestão Ágil de Tarefas e Projetos
            </p>
          </div>
        `,
        text: `Conexão com Resend Ativa! Sua RESEND_API_KEY está configurada no TaskFlow. Remetente: ${resendFrom}. Destinatário: ${testEmail}`,
      }),
    });

    const data: any = await resendRes.json().catch(() => ({}));
    if (resendRes.ok) {
      return res.json({
        success: true,
        message: `E-mail de teste enviado com sucesso para ${testEmail}!`,
        id: data.id,
      });
    } else {
      return res.status(resendRes.status || 400).json({
        success: false,
        error: data.message || "Erro retornado pela API do Resend.",
        details: data,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Erro ao conectar com a API do Resend.",
    });
  }
});

// Create & send invitation
app.post("/api/invites", async (req, res) => {
  try {
    const {
      email,
      name,
      role = "Colaborador(a)",
      username,
      avatarBg = "bg-indigo-600 text-white",
      inviterName = "Um membro da equipe",
      projectId = "proj-1",
      projectName = "TaskFlow",
      projectTasks = [],
      originUrl,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: "Nome e e-mail do colaborador são obrigatórios para enviar o convite.",
      });
    }

    const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Determine the base app URL (prefer client origin or APP_URL env, or request host)
    const hostHeader = req.get("host");
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = originUrl || process.env.APP_URL || `${protocol}://${hostHeader}`;

    // Token with self-contained payload in case server memory restarts
    const tokenData = {
      email,
      name,
      role,
      username: username || name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      avatarBg,
      inviterName,
      projectId,
      projectName,
      projectTasks,
    };
    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");
    const inviteUrl = `${baseUrl}?invite=${inviteId}&token=${token}`;

    // Store in memory
    const inviteRecord = {
      id: inviteId,
      ...tokenData,
      inviteUrl,
      createdAt: new Date().toISOString(),
    };
    storedInvites.set(inviteId, inviteRecord);

    // Prepare mailto link for direct 1-click fallback
    const mailSubject = `Convite para colaborar no projeto "${projectName}" - TaskFlow`;
    const mailBody = `Olá ${name},\n\n${inviterName} convidou você para colaborar no projeto "${projectName}" como ${role} no TaskFlow.\n\nPara acessar o quadro do projeto e começar a colaborar imediatamente, clique no link abaixo:\n${inviteUrl}\n\nSeja bem-vindo(a) à equipe!\nTaskFlow - Gestão Ágil`;
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

    let emailSent = false;
    let emailError: string | null = null;
    let providerUsed: string | null = null;

    // Check Resend first if available
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM || "TaskFlow <onboarding@resend.dev>";

    const htmlContent = generateInviteEmailHtml({
      name,
      email,
      role,
      inviterName,
      projectName,
      inviteUrl,
    });

    const textContent = generateInviteEmailText({
      name,
      role,
      inviterName,
      projectName,
      inviteUrl,
    });

    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [email],
            subject: mailSubject,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          providerUsed = "Resend";
          console.log(`[Invites] Convite enviado via Resend para ${email}`);
        } else {
          const errData: any = await resendRes.json().catch(() => ({}));
          emailError = errData?.message || "Erro no envio via Resend";
          console.error(`[Invites] Erro Resend:`, errData);
        }
      } catch (resendErr: any) {
        console.error(`[Invites] Exceção Resend:`, resendErr);
        emailError = resendErr.message || "Erro ao conectar com Resend.";
      }
    }

    // If Resend was not used or failed, check SMTP transport
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpFrom = process.env.SMTP_FROM || `"TaskFlow" <${smtpUser || "convites@taskflow.app"}>`;

    if (!emailSent && smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: email,
          subject: mailSubject,
          text: textContent,
          html: htmlContent,
        });

        emailSent = true;
        providerUsed = "SMTP";
        console.log(`[Invites] Convite enviado via SMTP para ${email}`);
      } catch (err: any) {
        console.error(`[Invites] Erro ao disparar email via SMTP para ${email}:`, err);
        emailError = err.message || "Falha no envio SMTP.";
      }
    }

    if (!emailSent && !resendApiKey && !(smtpHost && smtpUser && smtpPass)) {
      console.log(`[Invites] Convite gerado para ${email}. Nenhum provedor (Resend/SMTP) configurado nas variáveis de ambiente.`);
    }

    return res.json({
      success: true,
      inviteId,
      inviteUrl,
      emailSent,
      emailError,
      providerUsed,
      mailtoUrl,
      gmailUrl,
      outlookUrl,
      token,
      message: emailSent
        ? `Convite por e-mail disparado com sucesso para ${email} via ${providerUsed}!`
        : `Convite gerado com sucesso! Link pronto para envio ao colaborador.`,
    });
  } catch (error: any) {
    console.error("Erro ao gerar convite:", error);
    return res.status(500).json({
      error: "Falha ao processar convite de colaborador.",
      details: error.message || String(error),
    });
  }
});

// Retrieve invitation by ID
app.get("/api/invites/:id", (req, res) => {
  const { id } = req.params;
  const invite = storedInvites.get(id);

  if (!invite) {
    return res.status(404).json({
      success: false,
      error: "Convite não encontrado ou expirado.",
    });
  }

  return res.json({
    success: true,
    invite,
  });
});

// Vite middleware & Static asset serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TaskFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
