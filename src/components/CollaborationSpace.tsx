/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Collaborator, RevisionLog, DocumentState } from '../types';
import { INITIAL_COLLABORATORS, INITIAL_REVISION_LOGS } from '../data';
import { Users, FileText, CheckCircle, Wifi, WifiOff, Clock, Plus, CloudLightning, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'pending' | 'scheduled' | 'resolved';
}

const INITIAL_TASKS: Task[] = [
  { id: 'task-1', title: 'Revisar neumáticos de carretilla T4', assignee: 'Carlos Díaz', status: 'pending' },
  { id: 'task-2', title: 'Calibrar sensores IoT del muelle A', assignee: 'Ana Martínez', status: 'scheduled' },
  { id: 'task-3', title: 'Actualizar plan de mantenimiento BYD', assignee: 'Javier López', status: 'resolved' },
];

interface CollaborationSpaceProps {
  onLogUpdate: (action: string, details: string) => void;
  revisionLogs: RevisionLog[];
  onAddRevisionLog: (log: RevisionLog) => void;
  onShowToast?: (message: string, type: 'success' | 'info' | 'warn') => void;
}

export default function CollaborationSpace({ onLogUpdate, revisionLogs, onAddRevisionLog, onShowToast }: CollaborationSpaceProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [inviteName, setInviteName] = useState<string>('');
  const [isConfirmingPurge, setIsConfirmingPurge] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const [docState, setDocState] = useState<DocumentState>({
    title: 'Plan Operativo de la Flota de Muelle - Muelle A',
    content: `NOTAS DE TRABAJO COLABORATIVO - CARRETILLAS TR:
- Flota objetivo sugerida en base a la calculadora: 4 camiones frontales y 2 retráctiles para pasillo estrecho.
- Requisito de energía: BYD Liti-on ECB20 para muelle principal. Las baterías cargan al 100% durante el relevo de comidas de 14:00h.
- Mantenimiento predictivo: vigilar el neumático de tracción de la preparadora T4 para evitar tiempos de inactividad no planificados.`,
    updatedAt: 'Hace 5 minutos'
  });
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Sync mode notifications
  const handleDocChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedContent = e.target.value;
    setDocState(prev => ({
      ...prev,
      content: updatedContent,
      updatedAt: 'Hace unos instantes'
    }));
  };

  // Save / Sync Document trigger
  const triggerManualSync = () => {
    if (isOffline) {
      if (onShowToast) {
        onShowToast("Modo Sin Conexión activo. Los cambios se guardarán localmente.", 'warn');
      } else {
        alert("La aplicación está operando en 'Modo Sin Conexión'. Tus cambios están resguardados en el almacenamiento de caché local cifrado de tu navegador.");
      }
      return;
    }

    const newLog: RevisionLog = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user: 'Tú (Administrador)',
      action: 'Documento Sincronizado',
      details: 'Sincronización manual forzada del plan operativo. Archivos subidos y encriptados en la nube.'
    };
    onAddRevisionLog(newLog);
    onLogUpdate('Sincronización Nube', 'Documento operativo guardado y distribuido de extremo a extremo.');
    
    if (onShowToast) {
      onShowToast('¡Sincronizado con éxito! El documento ha sido cifrado con AES-XTS-512', 'success');
    } else {
      alert('✓ ¡Sincronizado con éxito! El documento ha sido cifrado con AES-XTS-512 antes de subirlo.');
    }
  };

  // Simulate teammate active editing simultaneous
  const simulatePeerEditing = () => {
    const peerName = 'Carlos Díaz (Logística)';
    setTypingUser(peerName);

    onLogUpdate('Edición Simultánea', `${peerName} está editando el texto compartido.`);

    setTimeout(() => {
      setDocState(prev => ({
        ...prev,
        content: prev.content + `\n\n[ACTUALIZACIÓN POR CARLOS DÍAZ]:\n* Coordinado curso de formación para el manejo seguro de carretillas BYD durante la primera semana de julio.`,
        updatedAt: 'Hace unos segundos'
      }));
      setTypingUser(null);

      const newLog: RevisionLog = {
        id: `rev-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: peerName,
        action: 'Documento Modificado',
        details: 'Añadidas directrices de formación técnica preventiva al muelle en vivo.'
      };
      onAddRevisionLog(newLog);
    }, 2800);
  };

  // Change offline state helper
  const toggleOfflineMode = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    if (nextState) {
      onLogUpdate('Cambio Red', 'Modo local offline habilitado. Sincronización en cola local.');
    } else {
      onLogUpdate('Cambio Red', 'Conexión restablecida. Sincronizando copias de seguridad pendientes...');
      // Sync trigger
      const newLog: RevisionLog = {
        id: `rev-offline-sync-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: 'Sistema Autonómico',
        action: 'Sincronización Offline',
        details: 'Conexión reanudada de forma segura. Volcado de caché local a los servidores globales de TR.'
      };
      onAddRevisionLog(newLog);
    }
  };

  const cycleTaskStatus = (taskId: string) => {
    const next: Record<Task['status'], Task['status']> = { pending: 'scheduled', scheduled: 'resolved', resolved: 'pending' };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next[t.status] } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee || 'Sin asignar',
      status: 'pending',
    };
    setTasks(prev => [...prev, task]);
    setNewTaskTitle('');
    setNewTaskAssignee('');
    setShowAddTask(false);
  };

  const taskCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    scheduled: tasks.filter(t => t.status === 'scheduled').length,
    resolved: tasks.filter(t => t.status === 'resolved').length,
  };

  return (
    <div id="collaboration-space-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Editorial Shared Document Area - 8 Columns */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Connection status card banner */}
        <div className="bg-gray-900 border border-gray-850 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOffline ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-white">
                  {isOffline ? 'Trabajando sin Conexión (Caché Local)' : 'Canal en Tiempo Real Conectado'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              </div>
              <p className="text-[11px] text-gray-500">
                {isOffline 
                  ? 'Cambios guardados localmente (Local IndexedDB). Sincronización automática suspendida.' 
                  : 'Sincronizando de extremo a extremo a través de nube segura (Carretillas TR).'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              id="btn-toggle-offline"
              onClick={toggleOfflineMode}
              className={`px-3 py-1.5 font-bold text-xs rounded-lg transition duration-150 border ${
                isOffline 
                  ? 'bg-amber-950/20 text-amber-400 border-amber-500/30 hover:border-amber-400' 
                  : 'bg-gray-950 text-gray-400 border-gray-850 hover:border-gray-700'
              }`}
            >
              Simular {isOffline ? 'Conexión Online' : 'Pérdida de Internet'}
            </button>
          </div>
        </div>

        {/* Notes Editor Card */}
        <div id="collab-notes-editor" className="bg-gray-900 border border-gray-850 p-5 rounded-2xl shadow-md space-y-4 relative">
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-850">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
              <input
                id="doc-title-input"
                type="text"
                value={docState.title}
                onChange={(e) => setDocState({ ...docState, title: e.target.value })}
                className="font-bold text-sm text-white bg-transparent outline-none focus:border-b focus:border-red-600 border-dashed border-gray-750 pb-1 w-full"
              />
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> mod: {docState.updatedAt}
            </div>
          </div>

          {/* Typing indicator */}
          {typingUser && (
            <div className="text-[10px] text-amber-500 px-3.5 py-1 bg-amber-500/5 border border-amber-500/10 rounded flex items-center gap-2 animate-pulse font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" /> {typingUser} está aportando cambios en directo...
            </div>
          )}

          {/* Task Manager */}
          <div className="bg-gray-950 border border-gray-850 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white uppercase tracking-wide">Tareas del Plan</span>
                {taskCounts.pending > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[9px] font-bold">{taskCounts.pending} pendiente{taskCounts.pending !== 1 ? 's' : ''}</span>
                )}
                {taskCounts.scheduled > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold">{taskCounts.scheduled} planificada{taskCounts.scheduled !== 1 ? 's' : ''}</span>
                )}
                {taskCounts.resolved > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">{taskCounts.resolved} resuelta{taskCounts.resolved !== 1 ? 's' : ''}</span>
                )}
              </div>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="p-1 text-gray-500 hover:text-white rounded transition"
                title="Añadir tarea"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 py-0.5"
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  <button
                    onClick={() => cycleTaskStatus(task.id)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 transition flex items-center justify-center ${
                      task.status === 'resolved'
                        ? 'bg-emerald-500 border-emerald-500'
                        : task.status === 'scheduled'
                        ? 'border-blue-400 bg-blue-950/30'
                        : 'border-gray-600 hover:border-amber-400'
                    }`}
                    title="Cambiar estado"
                  >
                    {task.status === 'resolved' && <span className="text-white text-[8px] leading-none">✓</span>}
                    {task.status === 'scheduled' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 block" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] block truncate ${task.status === 'resolved' ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                      {task.title}
                    </span>
                    <span className="text-[9px] text-gray-600">{task.assignee}</span>
                  </div>

                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                    task.status === 'resolved'
                      ? 'bg-emerald-950/30 text-emerald-600'
                      : task.status === 'scheduled'
                      ? 'bg-blue-950/30 text-blue-400'
                      : 'bg-amber-950/20 text-amber-500'
                  }`}>
                    {task.status === 'resolved' ? 'Resuelta' : task.status === 'scheduled' ? 'Planif.' : 'Pendiente'}
                  </span>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className={`flex-shrink-0 text-gray-700 hover:text-red-500 transition text-[10px] font-bold ${hoveredTaskId === task.id ? 'opacity-100' : 'opacity-0'}`}
                    title="Eliminar tarea"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showAddTask && (
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <input
                  type="text"
                  placeholder="Título de la tarea..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-red-600 focus:outline-none rounded-lg p-2 text-xs text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 focus:border-red-600 focus:outline-none rounded-lg p-2 text-xs text-gray-300"
                  >
                    <option value="">Asignar a...</option>
                    {collaborators.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addTask}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] transition"
                  >
                    Añadir
                  </button>
                  <button
                    onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskAssignee(''); }}
                    className="px-3 py-1.5 bg-gray-900 text-gray-400 hover:text-white rounded-lg text-[10px] transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <textarea
            id="doc-content-textarea"
            value={docState.content}
            onChange={handleDocChange}
            rows={10}
            className="w-full bg-gray-950 border border-gray-850 focus:border-red-600 focus:outline-none p-4 rounded-xl text-xs text-gray-300 font-mono leading-relaxed resize-none focus:ring-1 focus:ring-red-600 focus:text-white"
            placeholder="Introduce notas internas del muelle colaborativo de tu almacén aquí..."
          />

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Encriptación de Extremo a Extremo en Tránsito (AES-GCM)
            </span>
            
            <div className="flex gap-2">
              <button
                id="btn-simulate-Carlos"
                onClick={simulatePeerEditing}
                disabled={typingUser !== null}
                className="px-3.5 py-2 bg-gray-950 hover:bg-gray-800 text-gray-300 font-semibold rounded-lg text-[10px] transition duration-150 border border-gray-850 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CloudLightning className="w-3 h-3 text-red-500" /> Simular Cambio de Carlos
              </button>
              <button
                id="btn-doc-sync-nube"
                onClick={triggerManualSync}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] transition duration-150 flex items-center gap-1.5 shadow-md shadow-red-950/20"
              >
                Volcar Sincronización en Nube
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Collaborators & History Side Column - 4 Columns */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Collaborators list widget */}
        <div id="collab-users-list" className="bg-gray-900 border border-gray-850 p-5 rounded-2xl shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-850">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-red-500" /> Colaboradores
            </h3>
            <span className="text-[10px] bg-red-600/10 text-red-500 font-bold px-2 py-0.5 rounded border border-red-500/10">
              {collaborators.filter(c => c.active).length} Activos
            </span>
          </div>

          <div className="space-y-3">
            {collaborators.map(c => (
              <div id={`collaborator-item-${c.id}`} key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full ${c.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-inner`}>
                    {c.name.split(' ')[0][0]}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold block text-white">{c.name}</span>
                    <span className="text-[10px] text-gray-500">{c.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">
                    {c.active ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {isInviting ? (
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-2 mt-2">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Invitar Consultor Técnico</span>
              <input
                id="input-invite-collab"
                type="text"
                placeholder="Introducir nombre completo..."
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-red-600 focus:outline-none rounded-lg p-2 text-xs text-white"
                autoFocus
              />
              <div className="flex justify-end gap-2 text-[10px] font-bold">
                <button
                  id="btn-cancel-invite"
                  onClick={() => {
                    setIsInviting(false);
                    setInviteName('');
                  }}
                  className="px-3 py-1.5 bg-gray-900 text-gray-400 hover:text-white rounded transition"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-invite"
                  onClick={() => {
                    if (inviteName.trim()) {
                      const newCollab: Collaborator = {
                        id: `usr-${Date.now()}`,
                        name: `${inviteName.trim()} (Invitado)`,
                        role: 'Consultor General TR',
                        avatarColor: 'bg-amber-655',
                        active: true
                      };
                      setCollaborators([...collaborators, newCollab]);
                      onLogUpdate('Invitar Colaborador', `Añadido nuevo colaborador "${inviteName.trim()}" al espacio logístico.`);
                      if (onShowToast) {
                        onShowToast(`Invitación enviada a ${inviteName.trim()}`, 'success');
                      }
                      setIsInviting(false);
                      setInviteName('');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition shadow"
                >
                  Confirmar Enlace
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-invite-collaborator"
              onClick={() => setIsInviting(true)}
              className="w-full py-2 bg-gray-950 hover:bg-gray-850 text-gray-300 hover:text-white rounded-xl text-[10px] font-bold transition duration-150 border border-gray-850 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invitar Consultor Externo
            </button>
          )}
        </div>

        {/* Changes logs list widget */}
        <div id="collab-revision-history" className="bg-gray-900 border border-gray-850 p-5 rounded-2xl shadow-md space-y-4">
          <div className="pb-1 border-b border-gray-850">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-500" /> Historial de Cambios Cifrado
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">Auditabilidad total de la configuración.</p>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {revisionLogs.map(log => (
              <div id={`revision-log-item-${log.id}`} key={log.id} className="p-2.5 bg-gray-950 border border-gray-850 rounded-lg text-[10px] space-y-1">
                <div className="flex justify-between text-gray-500 font-mono">
                  <span>{log.user}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">{log.action}</span>
                  <span className="text-gray-400 block leading-tight">{log.details}</span>
                </div>
              </div>
            ))}
          </div>

          {isConfirmingPurge ? (
            <div className="flex gap-1">
              <button
                id="btn-cancel-purge"
                onClick={() => setIsConfirmingPurge(false)}
                className="w-1/2 py-2 text-xs bg-gray-950 hover:bg-gray-850 text-gray-400 font-bold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-purge"
                onClick={() => {
                  onAddRevisionLog({
                    id: 'rev-purge',
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    user: 'Tú (Administrador)',
                    action: 'Historial Purgado',
                    details: 'Auditoría anterior limpiada por motivos de espacio y encriptación.'
                  });
                  setIsConfirmingPurge(false);
                  if (onShowToast) {
                    onShowToast("Historial de auditoría purgado", 'info');
                  }
                }}
                className="w-1/2 py-2 text-xs bg-red-650 hover:bg-red-750 text-white font-bold rounded-lg transition"
              >
                Sí, Purgar Ahora
              </button>
            </div>
          ) : (
            <button
              id="btn-clear-history-logs"
              onClick={() => setIsConfirmingPurge(true)}
              className="w-full py-1.5 text-gray-600 hover:text-red-500 rounded text-[9px] font-bold uppercase transition duration-100 block text-center"
            >
              Purgar Logs
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
