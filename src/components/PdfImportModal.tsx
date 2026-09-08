import React, { useState, useRef } from 'react';
import {
  X,
  FileUp,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Task, ColumnId, TaskPriority, User } from '../types';

interface ParsedTaskPreview {
  title: string;
  description: string;
  priority: TaskPriority;
  column: ColumnId;
  estimatedHours: number;
  dueDate: string;
  subtasks: string[];
  tags: string[];
  suggestedAssignee?: string;
  selected: boolean;
}

interface PdfImportModalProps {
  currentProjectId: string;
  users: User[];
  onImportTasks: (newTasks: Partial<Task>[]) => void;
  onClose: () => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({
  currentProjectId,
  users,
  onImportTasks,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedProjectName, setParsedProjectName] = useState<string>('');
  const [parsedSummary, setParsedSummary] = useState<string>('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTaskPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
        setError('Por favor, selecione um arquivo no formato PDF (.pdf).');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const processPdfFile = async (pdfFile: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(pdfFile);
      const pdfBase64 = await base64Promise;

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          fileName: pdfFile.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao processar o arquivo PDF.');
      }

      const data = await response.json();

      setParsedProjectName(data.projectName || 'Projeto Importado');
      setParsedSummary(data.projectSummary || '');

      const tasksList: ParsedTaskPreview[] = (data.tasks || []).map((t: any) => ({
        title: t.title || 'Tarefa sem título',
        description: t.description || '',
        priority: (['baixa', 'media', 'alta', 'urgente'].includes(t.priority)
          ? t.priority
          : 'media') as TaskPriority,
        column: (['todo', 'in_progress', 'review'].includes(t.column)
          ? t.column
          : 'todo') as ColumnId,
        estimatedHours: t.estimatedHours || 8,
        dueDate:
          t.dueDate ||
          new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        tags: Array.isArray(t.tags) ? t.tags : ['Importado PDF'],
        suggestedAssignee: t.suggestedAssignee,
        selected: true,
      }));

      setParsedTasks(tasksList);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          'Ocorreu um erro ao extrair as tarefas do documento PDF. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Demo fallback to test immediately without having a local PDF file
  const handleLoadSamplePdfData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sampleText = `
ESCOPO DE PROJETO: Novo Portal de Atendimento ao Cliente e Suporte
1. Levantamento de Requisitos e Fluxogramas de Atendimento: Realizar entrevistas com time de suporte para definir árvore de decisão dos chamados.
2. Integração com WhatsApp Business API: Configurar webhook e autenticação para recebimento de tickets em tempo real.
3. Criação do Painel de Triagem com SLA: Desenvolver tabela Kanban com contagem regressiva de prazos e alertas para tickets atrasados.
4. Treinamento da Equipe e Homologação: Conduzir sessões de capacitação e testes simulados de carga.
`;

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: sampleText,
          fileName: 'Briefing_Portal_Atendimento.pdf',
        }),
      });

      const data = await response.json();

      setParsedProjectName(data.projectName || 'Portal de Atendimento');
      setParsedSummary(data.projectSummary || 'Implementação do sistema de suporte integrado');

      const tasksList: ParsedTaskPreview[] = (data.tasks || []).map((t: any) => ({
        title: t.title || 'Tarefa',
        description: t.description || '',
        priority: (['baixa', 'media', 'alta', 'urgente'].includes(t.priority)
          ? t.priority
          : 'media') as TaskPriority,
        column: (['todo', 'in_progress', 'review'].includes(t.column)
          ? t.column
          : 'todo') as ColumnId,
        estimatedHours: t.estimatedHours || 6,
        dueDate:
          t.dueDate ||
          new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : ['Levantamento preliminar', 'Validação'],
        tags: Array.isArray(t.tags) ? t.tags : ['Atendimento', 'Escopo'],
        suggestedAssignee: t.suggestedAssignee,
        selected: true,
      }));

      setParsedTasks(tasksList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar exemplo.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectTask = (index: number) => {
    setParsedTasks((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedTasks((prev) => prev.map((t) => ({ ...t, selected: select })));
  };

  const handleConfirmImport = () => {
    const selected = parsedTasks.filter((t) => t.selected);
    if (selected.length === 0) return;

    // Map suggested assignees to existing users if possible
    const tasksToAdd: Partial<Task>[] = selected.map((pt, idx) => {
      let matchedUserId: string | undefined = undefined;
      if (pt.suggestedAssignee) {
        const found = users.find(
          (u) =>
            u.name.toLowerCase().includes(pt.suggestedAssignee!.toLowerCase()) ||
            u.role.toLowerCase().includes(pt.suggestedAssignee!.toLowerCase())
        );
        if (found) matchedUserId = found.id;
      }
      if (!matchedUserId && users.length > 0) {
        matchedUserId = users[idx % users.length].id;
      }

      return {
        projectId: currentProjectId,
        title: pt.title,
        description: pt.description,
        priority: pt.priority,
        columnId: pt.column,
        dueDate: pt.dueDate,
        estimatedHours: pt.estimatedHours,
        trackedSeconds: 0,
        isTracking: false,
        assigneeId: matchedUserId,
        tags: pt.tags,
        subtasks: pt.subtasks.map((stTitle, sIdx) => ({
          id: `sub-pdf-${Date.now()}-${idx}-${sIdx}`,
          title: stTitle,
          completed: false,
        })),
        attachments: file
          ? [
              {
                id: `att-pdf-${Date.now()}-${idx}`,
                name: file.name,
                size: file.size,
                type: 'application/pdf',
                url: '#',
                uploadedAt: new Date().toISOString(),
              },
            ]
          : [],
        comments: [
          {
            id: `comm-pdf-${Date.now()}-${idx}`,
            userId: users[0]?.id || 'user-1',
            text: `Tarefa importada automaticamente a partir do documento PDF "${parsedProjectName}".`,
            createdAt: new Date().toISOString(),
            mentions: [],
          },
        ],
      };
    });

    onImportTasks(tasksToAdd);
    onClose();
  };

  const selectedCount = parsedTasks.filter((t) => t.selected).length;

  return (
    <div
      id="pdf-import-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="pdf-import-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                Importação Inteligente em PDF
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Extraia tarefas, subtarefas, prazos e prioridades diretamente de arquivos PDF
              </p>
            </div>
          </div>
          <button
            id="close-pdf-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Box (when no tasks parsed yet) */}
          {parsedTasks.length === 0 && (
            <div className="space-y-4">
              <div
                id="pdf-dropzone"
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  file
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-3 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>

                {file ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar de arquivo
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Clique para selecionar ou arraste seu documento PDF aqui
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                      Suporta editais, RFPs, atas de reunião, relatórios, cronogramas de projetos ou manuais de escopo.
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  id="test-sample-pdf-btn"
                  type="button"
                  onClick={handleLoadSamplePdfData}
                  disabled={isLoading}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Não tem PDF agora? Testar com Documento Exemplo</span>
                </button>

                <button
                  id="process-pdf-btn"
                  type="button"
                  disabled={!file || isLoading}
                  onClick={() => file && processPdfFile(file)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    !file || isLoading
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analisando PDF com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extrair Tarefas do PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedTasks.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Project summary banner */}
              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Projeto Identificado: {parsedProjectName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedTasks([]);
                      setFile(null);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Importar outro arquivo
                  </button>
                </div>
                {parsedSummary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{parsedSummary}</p>
                )}
              </div>

              {/* Selection Bar */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {parsedTasks.length} tarefas detectadas ({selectedCount} selecionadas)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    Marcar todas
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    Desmarcar todas
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {parsedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelectTask(idx)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      t.selected
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={() => toggleSelectTask(idx)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {t.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                            t.priority === 'urgente'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-transparent dark:border-rose-800/40'
                              : t.priority === 'alta'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {t.estimatedHours}h estimadas
                        </span>
                        {t.dueDate && (
                          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-1.5 py-0.5 rounded">
                            Prazo: {t.dueDate}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2 mb-1.5">
                        {t.description}
                      </p>

                      {/* Subtasks pills */}
                      {t.subtasks.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-medium text-slate-400 dark:text-slate-500">
                            {t.subtasks.length} subtarefas:
                          </span>
                          {t.subtasks.slice(0, 3).map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[150px] text-slate-700 dark:text-slate-300"
                            >
                              ✓ {st}
                            </span>
                          ))}
                          {t.subtasks.length > 3 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              +{t.subtasks.length - 3} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedTasks.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              As tarefas serão integradas ao quadro com subtarefas e anexo do PDF.
            </span>
            <button
              id="confirm-import-pdf-btn"
              type="button"
              disabled={selectedCount === 0}
              onClick={handleConfirmImport}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                selectedCount === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Importar {selectedCount} Tarefas para o Quadro</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
