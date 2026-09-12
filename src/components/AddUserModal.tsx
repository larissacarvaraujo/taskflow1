import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  AtSign,
  Briefcase,
  Check,
  AlertCircle,
  Copy,
  CheckCircle2,
  ExternalLink,
  Send,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import { User, Project, Task } from '../types';
import { sendCollaboratorInvite, InviteResponse } from '../services/inviteService';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Omit<User, 'id'>) => User;
  onRemoveUser?: (userId: string) => void;
  existingUsers: User[];
  currentProject?: Project;
  currentUser?: User | null;
  projectTasks?: Task[];
}

const AVATAR_COLORS = [
  { name: 'Índigo', bg: 'bg-indigo-600 text-white' },
  { name: 'Esmeralda', bg: 'bg-emerald-600 text-white' },
  { name: 'Âmbar', bg: 'bg-amber-600 text-white' },
  { name: 'Céu / Azul', bg: 'bg-sky-600 text-white' },
  { name: 'Rosa / Rose', bg: 'bg-rose-600 text-white' },
  { name: 'Violeta', bg: 'bg-purple-600 text-white' },
  { name: 'Teal', bg: 'bg-teal-600 text-white' },
  { name: 'Laranja', bg: 'bg-orange-600 text-white' },
];

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  onRemoveUser,
  existingUsers,
  currentProject,
  currentUser,
  projectTasks = [],
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [avatarBg, setAvatarBg] = useState(AVATAR_COLORS[0].bg);
  const [sendEmailInvite, setSendEmailInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invite' | 'members'>('invite');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate username suggestion when typing name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const slug = newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      setUsername(slug);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setEmail('');
    setUsername('');
    setRole('');
    setError(null);
    setInviteResult(null);
    setCopiedLink(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanRole = role.trim() || 'Colaborador(a)';

    if (!cleanName) {
      setError('Por favor, informe o nome completo da pessoa.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Por favor, insira um e-mail válido (ex: colega@empresa.com).');
      return;
    }

    if (!cleanUsername) {
      setError('Por favor, defina um identificador de menção (@usuario).');
      return;
    }

    // Check duplicates
    if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setError('Já existe um membro cadastrado com este e-mail.');
      return;
    }

    if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setError('Esta tag @' + cleanUsername + ' já está em uso por outro membro.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Add user locally to team
      const newUser = onAddUser({
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        role: cleanRole,
        avatarBg,
      });
      setCreatedUser(newUser);

      // 2. Dispatch invitation if requested
      if (sendEmailInvite) {
        const response = await sendCollaboratorInvite({
          email: cleanEmail,
          name: cleanName,
          role: cleanRole,
          username: cleanUsername,
          avatarBg,
          inviterName: currentUser?.name || 'Administrador',
          projectId: currentProject?.id || 'proj-1',
          projectName: currentProject?.name || 'TaskFlow',
          projectTasks,
        });

        setInviteResult(response);
      } else {
        handleResetAndClose();
      }
    } catch (err: any) {
      console.error('Error adding user or sending invite:', err);
      setError('Erro ao processar convite. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInviteLink = async (link: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div
      id="add-user-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4"
      onClick={handleResetAndClose}
    >
      <div
        id="add-user-modal-panel"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-black/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {inviteResult ? 'Convite Gerado com Sucesso' : 'Convidar Colaborador'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {inviteResult
                  ? 'Envie o acesso direto para o novo membro da equipe'
                  : 'Cadastre e envie o convite por e-mail para acesso à aplicação'}
              </p>
            </div>
          </div>

          <button
            id="close-add-user-modal-btn"
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar if invite has not been generated */}
        {!inviteResult && (
          <div className="flex border-b border-slate-200 dark:border-neutral-800 bg-slate-100/70 dark:bg-neutral-900/90 px-6 pt-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'invite'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convidar Novo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Membros da Equipe ({existingUsers.length})</span>
            </button>
          </div>
        )}

        {/* If invite was successfully created, show confirmation and 1-click dispatch controls */}
        {inviteResult ? (
          <div className="p-6 space-y-4">
            {inviteResult.emailSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    E-mail enviado com sucesso!
                  </h4>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                    O convite foi disparado para <strong>{email}</strong> via {inviteResult.providerUsed || 'servidor'}. O colaborador já pode verificar a caixa de entrada para entrar no projeto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    Convite e link de entrada prontos!
                  </h4>
                  <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                    O servidor não possui serviço de envio automático (Resend ou SMTP) configurado no ambiente. 
                    <strong> Para entregar o e-mail agora mesmo ao colaborador, use o botão do Gmail abaixo</strong> (abre com destinatário, assunto e link de acesso já preenchidos).
                  </p>
                </div>
              </div>
            )}

            {/* Primary Action: Direct 1-Click Gmail Web Dispatch */}
            {inviteResult.gmailUrl && (
              <div className="space-y-1.5">
                <a
                  id="send-via-gmail-web-btn"
                  href={inviteResult.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20 transition cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Disparar pelo Gmail Web (Abre pronto para enviar)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-auto" />
                </a>
              </div>
            )}

            {/* Direct Access Link Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Link Exclusivo de Entrada do Colaborador
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.inviteUrl}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-700 dark:text-slate-300 font-mono select-all truncate"
                />
                <button
                  id="copy-invite-link-btn"
                  type="button"
                  onClick={() => handleCopyInviteLink(inviteResult.inviteUrl)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Dispatch Alternative Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                id="whatsapp-invite-btn"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Olá ${name}! Você foi convidado(a) para colaborar no projeto "${currentProject?.name || 'TaskFlow'}". Acesse aqui para entrar: ${inviteResult.inviteUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Enviar pelo WhatsApp</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
              </a>

              <a
                id="mailto-invite-btn"
                href={inviteResult.mailtoUrl}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 transition"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Outro Aplicativo de E-mail</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
              </a>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
              <button
                id="finish-invite-modal-btn"
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : activeTab === 'members' ? (
          /* Team Members Management List */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
              <span>Membros com acesso a este workspace:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {existingUsers.length} participante(s)
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/80 pr-1 space-y-1">
              {existingUsers.map((u) => {
                const userTasksCount = projectTasks.filter((t) => t.assigneeId === u.id).length;
                const isCurrent = currentUser?.id === u.id;
                const isConfirming = confirmDeleteId === u.id;

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${u.avatarBg}`}
                      >
                        {u.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          @{u.username} • {u.role}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                        {userTasksCount} task{userTasksCount === 1 ? '' : 's'}
                      </span>

                      {onRemoveUser && (
                        <div>
                          {isConfirming ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onRemoveUser(u.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer text-[10px]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(u.id)}
                              disabled={existingUsers.length <= 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title={
                                existingUsers.length <= 1
                                  ? 'Não é possível remover o único membro do projeto'
                                  : 'Remover membro da equipe'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Convidar Novo Membro</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nome Completo da Pessoa *
              </label>
              <input
                id="new-user-name-input"
                type="text"
                required
                placeholder="Ex: Graciele Silva, Mariana Oliveira..."
                value={name}
                onChange={handleNameChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-black text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                E-mail de Convite e Acesso *
              </label>
              <input
                id="new-user-email-input"
                type="email"
                required
                placeholder="colaborador@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-black text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                O convite com o link de acesso direto à aplicação será preparado para este e-mail.
              </p>
            </div>

            {/* Username & Role in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Identificador @
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">@</span>
                  <input
                    id="new-user-username-input"
                    type="text"
                    required
                    placeholder="usuario"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))
                    }
                    className="w-full text-xs pl-7 pr-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-black text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Para marcar em comentários
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Cargo / Especialidade
                </label>
                <input
                  id="new-user-role-input"
                  type="text"
                  placeholder="Ex: Tech Lead, Designer, Dev"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-black text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Cor do Avatar de Identificação
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setAvatarBg(c.bg)}
                    title={c.name}
                    className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center text-xs font-bold transition-transform cursor-pointer ${
                      avatarBg === c.bg ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </button>
                ))}
              </div>
            </div>

            {/* Send email invite checkbox */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60 flex items-start gap-2.5">
              <input
                id="send-email-invite-checkbox"
                type="checkbox"
                checked={sendEmailInvite}
                onChange={(e) => setSendEmailInvite(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="send-email-invite-checkbox" className="text-xs cursor-pointer select-none">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Gerar convite e preparar envio por e-mail
                </span>
                <span className="text-slate-600 dark:text-slate-300 block text-[11px] mt-0.5">
                  Gera o link de entrada na aplicação e permite disparar pelo Gmail em 1 clique ou via servidor para {email || 'o colaborador'}.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="confirm-add-user-btn"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gerando Convite...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendEmailInvite ? 'Convidar por E-mail' : 'Adicionar Membro'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
