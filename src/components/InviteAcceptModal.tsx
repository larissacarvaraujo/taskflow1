import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Users, Briefcase } from 'lucide-react';
import { StoredInvite } from '../services/inviteService';

interface InviteAcceptModalProps {
  invite: StoredInvite;
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const InviteAcceptModal: React.FC<InviteAcceptModalProps> = ({
  invite,
  isOpen,
  onAccept,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="invite-accept-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="invite-accept-modal-panel"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden animate-scale-up"
      >
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Sparkles className="w-7 h-7 text-amber-300 animate-bounce" />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-indigo-100 backdrop-blur-sm mb-2">
            Convite Oficial para Colaboração
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Você foi convidado(a) para o TaskFlow!
          </h2>
          <p className="text-xs text-indigo-100 mt-1 max-w-sm mx-auto">
            {invite.inviterName} convidou você para colaborar em tempo real com a equipe.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Project Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Projeto Compartilhado
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-neutral-100">
              {invite.projectName}
            </div>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900">
                <Briefcase className="w-3.5 h-3.5" />
                Função: {invite.role}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Convidado(a) por: {invite.inviterName}
              </span>
            </div>
          </div>

          {/* Invited User Identity */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/50">
            <div className={`w-11 h-11 rounded-xl ${invite.avatarBg} flex items-center justify-center text-sm font-bold shadow-2xs text-white`}>
              {invite.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                  {invite.name}
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  @{invite.username}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                {invite.email}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verificado</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-start gap-2 bg-slate-100/60 dark:bg-neutral-800/40 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Ao entrar, seu login será realizado imediatamente neste navegador. Você terá acesso aos cards Kanban, visualização Runrun.it e comentários da equipe.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              id="decline-invite-btn"
              type="button"
              onClick={onDecline}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition cursor-pointer"
            >
              Agora não
            </button>
            <button
              id="accept-invite-btn"
              type="button"
              onClick={onAccept}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Entrar no Projeto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
