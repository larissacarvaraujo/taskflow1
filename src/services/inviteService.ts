import { User, Task, Project } from '../types';

export interface InvitePayload {
  email: string;
  name: string;
  role: string;
  username: string;
  avatarBg: string;
  inviterName: string;
  projectId: string;
  projectName: string;
  projectTasks?: Task[];
  originUrl?: string;
}

export interface InviteResponse {
  success: boolean;
  inviteId: string;
  inviteUrl: string;
  emailSent: boolean;
  emailError?: string | null;
  providerUsed?: string | null;
  mailtoUrl: string;
  gmailUrl?: string;
  outlookUrl?: string;
  token: string;
  message: string;
}

export interface EmailConfigStatus {
  configured: boolean;
  activeProvider: 'resend' | 'smtp' | 'none';
  resend: {
    isConfigured: boolean;
    maskedKey: string | null;
    sender: string;
    isTestDomain: boolean;
  };
  smtp: {
    isConfigured: boolean;
    host: string | null;
    user: string | null;
  };
}

/**
 * Checks if Resend or SMTP is configured on the server
 */
export async function getEmailConfigStatus(): Promise<EmailConfigStatus> {
  try {
    const res = await fetch('/api/invites/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch email config status:', err);
  }
  return {
    configured: false,
    activeProvider: 'none',
    resend: {
      isConfigured: false,
      maskedKey: null,
      sender: 'TaskFlow <onboarding@resend.dev>',
      isTestDomain: true,
    },
    smtp: {
      isConfigured: false,
      host: null,
      user: null,
    },
  };
}

export interface StoredInvite {
  id: string;
  email: string;
  name: string;
  role: string;
  username: string;
  avatarBg: string;
  inviterName: string;
  projectId: string;
  projectName: string;
  projectTasks?: Task[];
  createdAt: string;
}

/**
 * Creates and sends an invitation for a collaborator.
 */
export async function sendCollaboratorInvite(
  payload: InvitePayload
): Promise<InviteResponse> {
  const origin = window.location.origin;
  const fullPayload = {
    ...payload,
    originUrl: origin,
  };

  try {
    const response = await fetch('/api/invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPayload),
    });

    if (response.ok) {
      const data: InviteResponse = await response.json();
      return data;
    }
  } catch (error) {
    console.warn('Backend /api/invites failed or unreachable, generating client-side fallback invite:', error);
  }

  // Client-side fallback token generation
  const fallbackId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fallbackToken = btoa(unescape(encodeURIComponent(JSON.stringify(fullPayload))));
  const fallbackInviteUrl = `${origin}?invite=${fallbackId}&token=${encodeURIComponent(fallbackToken)}`;
  
  const emailSubject = encodeURIComponent(`Convite para colaborar no projeto "${payload.projectName}" - TaskFlow`);
  const emailBody = encodeURIComponent(
    `Olá ${payload.name},\n\n` +
    `${payload.inviterName} convidou você para colaborar no projeto "${payload.projectName}" como ${payload.role} no TaskFlow.\n\n` +
    `Para entrar imediatamente na aplicação e começar a colaborar, clique no link abaixo:\n` +
    `${fallbackInviteUrl}\n\n` +
    `Seja bem-vindo(a) à equipe!\nTaskFlow - Gestão Ágil`
  );
  const mailtoUrl = `mailto:${encodeURIComponent(payload.email)}?subject=${emailSubject}&body=${emailBody}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(payload.email)}&su=${emailSubject}&body=${emailBody}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(payload.email)}&subject=${emailSubject}&body=${emailBody}`;

  return {
    success: true,
    inviteId: fallbackId,
    inviteUrl: fallbackInviteUrl,
    emailSent: false,
    emailError: null,
    providerUsed: null,
    mailtoUrl,
    gmailUrl,
    outlookUrl,
    token: fallbackToken,
    message: 'Convite gerado com sucesso.',
  };
}

/**
 * Fetches invite details from the server or decodes from URL token.
 */
export async function resolveInvite(inviteId?: string | null, token?: string | null): Promise<StoredInvite | null> {
  // Try server first if inviteId is provided
  if (inviteId) {
    try {
      const res = await fetch(`/api/invites/${inviteId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.invite) {
          return data.invite;
        }
      }
    } catch (e) {
      console.warn('Could not fetch invite from server, checking token fallback:', e);
    }
  }

  // Decode fallback token from URL
  if (token) {
    try {
      const decodedJson = decodeURIComponent(escape(atob(decodeURIComponent(token))));
      const parsed = JSON.parse(decodedJson);
      if (parsed && parsed.email && parsed.name) {
        return {
          id: inviteId || 'token-invite',
          email: parsed.email,
          name: parsed.name,
          role: parsed.role || 'Colaborador(a)',
          username: parsed.username || parsed.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          avatarBg: parsed.avatarBg || 'bg-indigo-600 text-white',
          inviterName: parsed.inviterName || 'Um colega',
          projectId: parsed.projectId || 'proj-1',
          projectName: parsed.projectName || 'Projeto TaskFlow',
          projectTasks: parsed.projectTasks || [],
          createdAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Failed to parse fallback token:', err);
    }
  }

  return null;
}
