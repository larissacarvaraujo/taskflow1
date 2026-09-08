import React from 'react';
import { BellRing, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { NotificationPermissionStatus } from '../services/systemNotificationService';

interface NotificationPermissionBannerProps {
  permission: NotificationPermissionStatus;
  onRequestPermission: () => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

export const NotificationPermissionBanner: React.FC<
  NotificationPermissionBannerProps
> = ({ permission, onRequestPermission, onDismiss, isDismissed }) => {
  if (isDismissed) return null;
  if (permission === 'granted' || permission === 'unsupported') return null;

  return (
    <div
      id="system-notification-permission-banner"
      className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 py-2.5 shadow-md border-b border-indigo-700/60 relative z-30 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span>Alertas de Prazos em Segundo Plano</span>
              <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-xs">
                Novo
              </span>
            </p>
            <p className="text-indigo-200/90 text-[11px] leading-tight">
              {permission === 'denied'
                ? 'As notificações estão bloqueadas no seu navegador. Permita nas configurações do site para receber avisos fora da aba.'
                : 'Ative as notificações do sistema para ser alertado quando tarefas vencerem, mesmo com o navegador minimizado.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {permission === 'default' && (
            <button
              id="request-notification-permission-btn"
              type="button"
              onClick={onRequestPermission}
              className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium shadow-xs transition cursor-pointer text-xs whitespace-nowrap flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ativar Notificações</span>
            </button>
          )}

          {permission === 'denied' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-700/80 text-rose-200 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Bloqueado no navegador</span>
            </div>
          )}

          <button
            id="dismiss-notification-banner-btn"
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-md text-indigo-300 hover:text-white hover:bg-indigo-700/50 transition cursor-pointer"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
