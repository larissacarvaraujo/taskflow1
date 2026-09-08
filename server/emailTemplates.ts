export function generateInviteEmailHtml(params: {
  name: string;
  email: string;
  role: string;
  inviterName: string;
  projectName: string;
  inviteUrl: string;
}): string {
  const { name, inviterName, projectName, role, inviteUrl } = params;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para colaborar no TaskFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 32px 36px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #ffffff; width: 42px; height: 42px; border-radius: 10px; text-align: center; vertical-align: middle;">
                    <span style="color: #4f46e5; font-size: 24px; font-weight: bold; line-height: 42px;">⚡</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: block;">TaskFlow</span>
                    <span style="color: #c7d2fe; font-size: 11px; font-weight: 500; display: block;">Gestão Ágil & Colaboração</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Olá, ${escapeHtml(name)}!
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                <strong>${escapeHtml(inviterName)}</strong> convidou você para fazer parte da equipe no <strong>TaskFlow</strong> e colaborar no projeto:
              </p>

              <!-- Project Highlight Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
                      Projeto
                    </span>
                    <span style="font-size: 16px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 8px;">
                      ${escapeHtml(projectName)}
                    </span>
                    <span style="font-size: 13px; color: #64748b;">
                      Sua função atribuída: <strong style="color: #4f46e5;">${escapeHtml(role)}</strong>
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Ao entrar, você terá acesso imediato ao quadro Kanban, atribuições de tarefas, acompanhamento de prazos e chat da equipe.
              </p>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
                      Aceitar Convite e Entrar no Projeto &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link Box -->
              <div style="background-color: #f8fafc; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
                <p style="margin: 0 0 6px 0;">
                  Se o botão acima não funcionar, copie e cole o link direto abaixo em seu navegador:
                </p>
                <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all; font-family: monospace; font-size: 11px;">
                  ${inviteUrl}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Este convite foi enviado para <strong>${escapeHtml(params.email)}</strong>.<br>
                TaskFlow &bull; Sistema Integrado de Gestão Ágil e Produtividade
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateInviteEmailText(params: {
  name: string;
  role: string;
  inviterName: string;
  projectName: string;
  inviteUrl: string;
}): string {
  return `Olá ${params.name},\n\n` +
    `${params.inviterName} convidou você para colaborar no projeto "${params.projectName}" como ${params.role} no TaskFlow.\n\n` +
    `Para aceitar o convite e entrar imediatamente na aplicação, clique no link abaixo:\n` +
    `${params.inviteUrl}\n\n` +
    `Seja bem-vindo(a) à equipe!\nTaskFlow - Gestão Ágil`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
