/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calculator, 
  Cpu, 
  Leaf, 
  Users, 
  ShieldAlert, 
  Smartphone, 
  BatteryMedium, 
  Lock, 
  Unlock, 
  FileText, 
  TrendingUp, 
  HelpCircle, 
  Layers, 
  Wrench, 
  RefreshCw, 
  Zap, 
  ExternalLink 
} from 'lucide-react';

import { WarehouseParams, ForkliftIoT, MaintenanceAlert, RevisionLog } from './types';
import { CATALOG_PRESETS, INITIAL_PARAMS, INITIAL_ALERTS, INITIAL_REVISION_LOGS, INITIAL_FLEET, DEMO_CLIENTS, calculateFleet } from './data';

import FleetCalculator from './components/FleetCalculator';
import IoTPanel from './components/IoTPanel';
import EnergyEfficiency from './components/EnergyEfficiency';
import CollaborationSpace from './components/CollaborationSpace';
import BiometricLock from './components/BiometricLock';

export default function App() {
  // Global States
  const [activeClientId, setActiveClientId] = useState<string>('client-mediterraneo');
  const [params, setParams] = useState<WarehouseParams>(INITIAL_PARAMS);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>(INITIAL_ALERTS);
  const [fleet, setFleet] = useState<ForkliftIoT[]>(INITIAL_FLEET);
  const [revisionLogs, setRevisionLogs] = useState<RevisionLog[]>(INITIAL_REVISION_LOGS);
  
  // Custom Toast State (bypasses standard iframe alert restrictions)
  const [toast, setToast] = useState<{message: string; type: 'success' | 'info' | 'warn'} | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  const handleClientChange = (clientId: string) => {
    const selected = DEMO_CLIENTS.find(c => c.id === clientId);
    if (!selected) return;
    
    setActiveClientId(clientId);
    setParams(selected.params);
    setFleet(selected.fleet);
    setAlerts(selected.alerts);
    
    pushSystemLog(
      'Cambio de Cuenta SaaS', 
      `Sincronizada licencia autorizada de "${selected.companyName}". Calibrando telemetría.`
    );
    showToast(`Cuenta activa: ${selected.name}`, 'info');
  };

  // App Config States
  const [activeTab, setActiveTab] = useState<'calculator' | 'telemetry' | 'energy' | 'collaboration'>('calculator');
  const [isPowerSavingMode, setIsPowerSavingMode] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(true); // unlocked by default but can be locked
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Iniciando sistema operativo TR Fleet Hub...',
    'Sensores IoT sincronizados mediante protocolo encriptado LoraWAN.',
    'Baterías de Litio BYD calibradas en muelle central.'
  ]);

  // Handler to add a system simulation log
  const pushSystemLog = (action: string, details: string) => {
    const formatted = `[${new Date().toLocaleTimeString()}] ${action}: ${details}`;
    setSystemLogs(prev => [formatted, ...prev.slice(0, 15)]);
  };

  const handleAddRevisionLog = (log: RevisionLog) => {
    setRevisionLogs(prev => [log, ...prev]);
  };

  // Quick stats computed
  const recommendedCalculated = calculateFleet(params).recommendedForklifts;

  return (
    <div 
      id="app-root-container" 
      className={`min-h-screen font-sans antialiased text-gray-300 transition duration-300 flex flex-col justify-between ${
        isPowerSavingMode 
          ? 'bg-gray-950 text-gray-400 contrast-85 brightness-90 saturate-50' 
          : 'bg-[#080d16]'
      }`}
    >
      
      {/* Talleres y Recambios Corporate Top Banner */}
      <header id="tr-header" className="bg-[#0c1421] border-b border-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="bg-red-600 px-3 py-1 text-white font-black text-sm tracking-tight rounded flex items-center justify-center">
                  TR
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-white text-base tracking-wider block leading-none">CARRETILLAS TR</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">TALLERES Y RECAMBIOS</span>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-gray-800 hidden md:block" />
              <div className="hidden md:block">
                <span className="text-xs text-amber-500 font-semibold italic">Pasión por el cliente intralogístico desde 1867</span>
              </div>
            </div>

            {/* Top configuration elements */}
            <div className="flex items-center gap-2.5">
              
              {/* Intelligent Power Saving Mode Indicator */}
              <button
                id="btn-toggle-battery-saving"
                onClick={() => {
                  const nextState = !isPowerSavingMode;
                  setIsPowerSavingMode(nextState);
                  pushSystemLog(
                    nextState ? 'Ahorro Energía Activado' : 'Ahorro Energía Desactivado', 
                    nextState 
                      ? 'Límites de CPU ajustados en hilos de comunicación y frames telemetry.'
                      : 'Rendimiento gráfico y telemetría de alta frecuencia restaurada.'
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition group ${
                  isPowerSavingMode 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-gray-900 hover:bg-gray-850 text-gray-400 border-gray-850 hover:text-gray-300'
                }`}
                title="Alternar Modo de Ahorro de Energía Inteligente"
              >
                <BatteryMedium className={`w-4 h-4 ${isPowerSavingMode ? 'text-emerald-400 animate-pulse' : 'text-gray-500 group-hover:text-gray-400'}`} />
                <span className="hidden xs:inline">
                  {isPowerSavingMode ? 'Eco-Modo Activo' : 'Ahorro Batería'}
                </span>
              </button>

              <div className="h-4 w-[1px] bg-gray-800" />

              {/* Technical active services link */}
              <a 
                id="link-tr-technical"
                href="https://talleresyrecambios.com/" 
                target="_blank" 
                rel="noreferrer noopener"
                className="hidden lg:flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition uppercase font-bold tracking-wider"
              >
                Oficina TR <ExternalLink className="w-3 h-3 text-red-500" />
              </a>

            </div>

          </div>
        </div>
      </header>

      {/* Hero Welcome banner */}
      <div id="welcome-banner" className="bg-[#0b121e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-900/40">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">TR Elevación Inteligente & IoT Hub</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Mide requerimientos de flota basándote en la logística operativa (viajes, tiempos de tránsito, tonelaje), 
              monitorea sensores mecánicos con alertas predictivas de mantenimiento, y calcula la huella energética.
            </p>
          </div>

          {/* Quick Metrics display */}
          <div className="flex gap-4 font-mono">
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-850 text-center">
              <span className="text-[9px] uppercase text-gray-500 block">Flotilla Teórica</span>
              <span id="quick-recommended-calc" className="text-sm font-black text-amber-500">{recommendedCalculated} uds.</span>
            </div>
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-850 text-center">
              <span className="text-[9px] uppercase text-gray-500 block">Alertas Activas</span>
              <span id="quick-alerts-count" className="text-sm font-black text-red-500">{alerts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <main id="app-workspace" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Client Profile / Company Workspace Switcher */}
        <div id="client-profile-switcher" className="bg-[#0b121f] border border-gray-950 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3.5 border-b border-gray-900/60">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-red-600/10 text-red-500 rounded-xl font-bold font-mono text-xs border border-red-500/10 uppercase tracking-widest leading-none">
                SaaS
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Licencia Activa Cliente TR</h2>
                  <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 font-bold px-2 py-0.5 rounded-full animate-pulse">SLA Conectado</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Visualizando datos en tiempo real optimizados para la flota del cliente seleccionado.</p>
              </div>
            </div>
            
            <div id="client-selectors-buttons" className="flex flex-wrap gap-2">
              {DEMO_CLIENTS.map((cli) => {
                const isSelected = activeClientId === cli.id;
                return (
                  <button
                    id={`btn-select-client-${cli.id}`}
                    key={cli.id}
                    onClick={() => handleClientChange(cli.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      isSelected 
                        ? 'bg-red-650 border-[#ea3838] text-white shadow-lg' 
                        : 'bg-gray-900 hover:bg-gray-850 hover:text-white border-gray-850 text-gray-400'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-ping' : cli.logoColor}`} />
                    {cli.name}
                  </button>
                );
              })}
            </div>
          </div>

          {(() => {
            const currentCli = DEMO_CLIENTS.find(c => c.id === activeClientId);
            if (!currentCli) return null;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">Razón Social</span>
                  <span className="text-white block font-semibold">{currentCli.companyName}</span>
                </div>
                <div className="space-y-1 md:border-l md:border-gray-900/60 md:pl-4">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">Ubicación de Planta</span>
                  <span className="text-gray-300 block font-medium">{currentCli.location}</span>
                </div>
                <div className="space-y-1 md:border-l md:border-gray-900/60 md:pl-4">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">Entorno Técnico & Logístico</span>
                  <span className="text-gray-400 block leading-tight">{currentCli.description}</span>
                </div>
              </div>
            );
          })()}
        </div>
        
        {/* Workspace Navigation Tabs & Sync controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#0d1422] p-2.5 rounded-xl border border-gray-900">
          
          {/* Navigation Items */}
          <div id="tabs-navigation" className="flex flex-wrap gap-1.5">
            <button
              id="tab-btn-calculator"
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'calculator' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Calculator className="w-4 h-4" /> Calculadora de Flota
            </button>

            <button
              id="tab-btn-telemetry"
              onClick={() => setActiveTab('telemetry')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'telemetry' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Cpu className="w-4 h-4" /> Telemetría IoT
            </button>

            <button
              id="tab-btn-energy"
              onClick={() => setActiveTab('energy')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'energy' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Leaf className="w-4 h-4" /> Eficiencia Energética / BYD
            </button>

            <button
              id="tab-btn-collaboration"
              onClick={() => setActiveTab('collaboration')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'collaboration' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Users className="w-4 h-4" /> Plan Colaborativo
            </button>
          </div>

          {/* Secure Admin Keylock toggle */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[10px] text-gray-500 font-medium">Panel Administrativo:</span>
            {isAdminUnlocked ? (
              <button
                id="btn-lock-biometrics"
                onClick={() => {
                  setIsAdminUnlocked(false);
                  pushSystemLog('Acceso Bloqueado', 'Se cerró manualmente la sesión colaborativa protegida por Huella.');
                }}
                className="px-3 py-1.5 bg-emerald-950/30 text-emerald-400 hover:text-emerald-200 border border-emerald-500/20 rounded-lg text-[10px] flex items-center gap-1 hover:border-emerald-500"
              >
                <Unlock className="w-3 h-3 text-emerald-400" /> Desbloqueado (E2EE)
              </button>
            ) : (
              <button
                id="btn-unlock-biometrics"
                onClick={() => setIsAdminUnlocked(true)}
                className="px-3 py-1.5 bg-gray-900 text-amber-500 hover:text-amber-400 border border-gray-850 rounded-lg text-[10px] flex items-center gap-1 font-bold shadow-inner"
              >
                <Lock className="w-3 h-3 text-red-500 animate-pulse" /> Requiere Biometría
              </button>
            )}
          </div>

        </div>

        {/* Tab workspace controller */}
        <div id="tab-viewport" className="min-h-[400px]">
          {activeTab === 'calculator' && (
            <FleetCalculator 
              onParamsChange={(updated) => setParams(updated)} 
              currentParams={params}
              onLogUpdate={pushSystemLog}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'telemetry' && (
            <IoTPanel 
              isEnergySavingMode={isPowerSavingMode}
              onLogUpdate={pushSystemLog}
              alerts={alerts}
              onAlertsChange={setAlerts}
              fleet={fleet}
              onFleetChange={setFleet}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'energy' && (
            <EnergyEfficiency 
              currentParams={params}
              onLogUpdate={pushSystemLog}
            />
          )}

          {activeTab === 'collaboration' && (
            <div>
              {isAdminUnlocked ? (
                <CollaborationSpace 
                  onLogUpdate={pushSystemLog}
                  revisionLogs={revisionLogs}
                  onAddRevisionLog={handleAddRevisionLog}
                  onShowToast={showToast}
                />
              ) : (
                <div id="locked-administrative-space" className="py-12">
                  <BiometricLock 
                    isUnlocked={isAdminUnlocked}
                    onUnlock={() => {
                      setIsAdminUnlocked(true);
                      pushSystemLog('Acceso Biométrico O.K', 'Sustitución de claves digitales efectuada vía huella digital.');
                    }}
                    onLock={() => setIsAdminUnlocked(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time System Debug telemetry logs (lower level dashboard) */}
        <div id="terminal-system-logs" className="bg-gray-950 border border-gray-900 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-650 rounded-full animate-pulse" /> Terminal de Eventos Logísticos TR (Cifrado local: AES-256)
            </span>
            <button
              id="btn-clear-terminal-logs"
              onClick={() => setSystemLogs(['Sistema borrado. Logs calibrados.'])}
              className="text-[9px] text-gray-650 hover:text-gray-400 uppercase font-mono tracking-tight"
            >
              Limpiar terminal
            </button>
          </div>

          <div className="bg-[#05090f] p-3 rounded-lg border border-gray-900/60 font-mono text-[10px] text-gray-400 space-y-1.5 h-28 overflow-y-auto">
            {systemLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed truncate hover:text-white transition duration-100">
                <span className="text-gray-650">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer id="tr-app-footer" className="bg-[#0c1421] border-t border-gray-900 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 divide-y divide-gray-900 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-left space-y-0.5">
              <span className="font-bold text-gray-400 block">Talleres y Recambios S.A.</span>
              <span className="text-[10px] text-gray-600 block">Distribuidora y servicio de maquinaria para almacenamiento y logística desde 1867.</span>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
              <Smartphone className="w-3.5 h-3.5" /> Mobile Ready • Diseñado para Alta Sincronización
            </div>
          </div>
          <div className="pt-4 flex flex-wrap justify-between items-center text-[10px] text-gray-600">
            <span>© 2026 Carretillas TR. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <a href="https://talleresyrecambios.com/" className="hover:underline hover:text-gray-400">BYD Forklifts</a>
              <a href="https://talleresyrecambios.com/" className="hover:underline hover:text-gray-400">MB Forfklift</a>
              <a href="https://talleresyrecambios.com/" className="hover:underline hover:text-gray-400">Caterpillar EP</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Dynamic Custom Toast Notification System (Bypasses iframe blocks beautifully) */}
      {toast && (
        <div 
          id="custom-toast" 
          className={`fixed bottom-6 right-6 z-[100] px-4 py-3.5 rounded-xl border shadow-2xl flex items-center justify-between gap-3 animate-fade-in transition duration-300 ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' 
              : toast.type === 'warn'
              ? 'bg-red-950/90 text-red-300 border-red-500/30'
              : 'bg-[#0e1726]/90 text-amber-450 border-amber-500/20'
          }`}
        >
          <div className="text-xs font-semibold">{toast.message}</div>
          <button 
            onClick={() => setToast(null)} 
            className="text-[10px] uppercase font-bold text-gray-500 hover:text-white pb-0.5 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
