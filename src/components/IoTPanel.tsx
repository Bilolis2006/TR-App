/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ForkliftIoT, MaintenanceAlert } from '../types';
import { INITIAL_FLEET, INITIAL_ALERTS } from '../data';
import { Radio, ShieldAlert, Cpu, Wrench, Battery, Thermometer, UserCheck, AlertTriangle, Play, Pause, Power, CheckCircle, Flame } from 'lucide-react';

interface IoTPanelProps {
  isEnergySavingMode: boolean;
  onLogUpdate: (action: string, details: string) => void;
  alerts: MaintenanceAlert[];
  onAlertsChange: (newAlerts: MaintenanceAlert[]) => void;
  fleet: ForkliftIoT[];
  onFleetChange: React.Dispatch<React.SetStateAction<ForkliftIoT[]>>;
  onShowToast?: (message: string, type: 'success' | 'info' | 'warn') => void;
}

export default function IoTPanel({ isEnergySavingMode, onLogUpdate, alerts, onAlertsChange, fleet, onFleetChange, onShowToast }: IoTPanelProps) {
  const setFleet = onFleetChange;
  const [selectedMachineId, setSelectedMachineId] = useState<string>(fleet[0]?.id || 'TR-FLEET-01');
  const [isTelemetryLive, setIsTelemetryLive] = useState<boolean>(true);

  // Get currently selected machine
  const activeMachine = fleet.find(f => f.id === selectedMachineId) || fleet[0] || {
    id: 'TR-FLEET-01',
    name: 'Carretilla Indefinida',
    type: 'Frontal',
    brand: 'BYD Liti-on',
    status: 'operational',
    batteryPct: 100,
    temperature: 25,
    speedKmh: 0,
    totalHours: 0,
    wearIndicators: { hydraulics: 0, tractionTires: 0, brakesLine: 0, batteryHealth: 100 }
  } as ForkliftIoT;

  // IoT Sensor Telemetry Simulator (Real-time update)
  useEffect(() => {
    if (!isTelemetryLive) return;

    // Determine interval speed based on Energy Saving Mode
    const intervalMs = isEnergySavingMode ? 8000 : 2500;

    const timer = setInterval(() => {
      setFleet(prevFleet => {
        return prevFleet.map(machine => {
          // Skip if under full maintenance
          if (machine.status === 'maintenance') return machine;

          // Minor fluctuations in metrics
          const speedDelta = (Math.random() - 0.5) * 1.5;
          const tempDelta = (Math.random() - 0.5) * 1.0;
          
          let newSpeed = Math.max(0, Math.min(12, Number((machine.speedKmh + speedDelta).toFixed(1))));
          if (newSpeed === 0 && Math.random() > 0.8) newSpeed = 4.5; // Wake up static machines

          let newTemp = Math.max(20, Math.min(85, Number((machine.temperature + tempDelta).toFixed(1))));
          
          let newBattery = Math.max(0, Number((machine.batteryPct - (isEnergySavingMode ? 0.05 : 0.15)).toFixed(1)));
          if (newBattery <= 0) {
            newBattery = 100; // Simulated battery charge swap
          }

          // Slow drift of wear indicators to simulate continuous usage of materials
          const wearHydraulicDelta = Math.random() * 0.12;
          const wearTiresDelta = Math.random() * 0.15;
          const wearBrakesDelta = Math.random() * 0.11;
          const wearBatteryHealthSoh = -Math.random() * 0.02; // very slow degradation

          const hydraulics = Math.min(100, Number((machine.wearIndicators.hydraulics + wearHydraulicDelta).toFixed(2)));
          const tractionTires = Math.min(100, Number((machine.wearIndicators.tractionTires + wearTiresDelta).toFixed(2)));
          const brakesLine = Math.min(100, Number((machine.wearIndicators.brakesLine + wearBrakesDelta).toFixed(2)));
          const batteryHealth = Math.max(50, Number((machine.wearIndicators.batteryHealth + wearBatteryHealthSoh).toFixed(2)));

          // Determine status based on critical wear levels
          let status = machine.status;
          const maxWear = Math.max(hydraulics, tractionTires, brakesLine);
          
          if (newBattery < 15) {
            status = 'critical';
          } else if (maxWear > 80) {
            status = 'critical';
          } else if (maxWear > 65) {
            status = 'warning';
          } else {
            status = 'operational';
          }

          return {
            ...machine,
            speedKmh: newSpeed,
            temperature: newTemp,
            batteryPct: newBattery,
            status,
            wearIndicators: {
              hydraulics,
              tractionTires,
              brakesLine,
              batteryHealth
            }
          };
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTelemetryLive, isEnergySavingMode]);

  // Handle Wear simulation triggers
  const addWearToMachine = (machineId: string) => {
    setFleet(prev => prev.map(m => {
      if (m.id !== machineId) return m;

      // Add intense wear to components
      const newHydraulics = Math.min(100, m.wearIndicators.hydraulics + 15);
      const newTires = Math.min(100, m.wearIndicators.tractionTires + 12);
      const newBrakes = Math.min(100, m.wearIndicators.brakesLine + 18);
      const newSoh = Math.max(55, m.wearIndicators.batteryHealth - 2);

      let status = m.status;
      const maxWear = Math.max(newHydraulics, newTires, newBrakes);
      if (maxWear > 80) status = 'critical';
      else if (maxWear > 65) status = 'warning';

      // Dynamically fire predictive alarms if threshold exceeded
      if (newBrakes >= 75) {
        const brakeAlertExists = alerts.some(a => a.machineId === m.id && a.component === 'Pastillas de Freno');
        if (!brakeAlertExists) {
          const newAlert: MaintenanceAlert = {
            id: `ALT-DYNAMIC-${Date.now()}`,
            machineId: m.id,
            machineName: m.name,
            component: 'Pastillas de Freno',
            severity: 'high',
            message: `Desgaste severo provocado por uso continuo. Pastillas de freno al ${newBrakes.toFixed(1)}%. Sustitución crítica recomendada.`,
            triggeredAt: 'Hace unos instantes',
            status: 'pending'
          };
          onAlertsChange([newAlert, ...alerts]);
          onLogUpdate('Alerta IoT Activada', `Detectado desgaste crítico en frenos de ${m.name}.`);
        }
      }

      if (newHydraulics >= 75) {
        const hydAlertExists = alerts.some(a => a.machineId === m.id && a.component === 'Manguitos Hidráulicos');
        if (!hydAlertExists) {
          const newAlert: MaintenanceAlert = {
            id: `ALT-DYNAMIC-${Date.now() + 1}`,
            machineId: m.id,
            machineName: m.name,
            component: 'Manguitos Hidráulicos',
            severity: 'medium',
            message: `Presión inestable en mangueras de soporte. Desgaste hidráulico calculado al ${newHydraulics.toFixed(1)}%.`,
            triggeredAt: 'Hace un momento',
            status: 'pending'
          };
          onAlertsChange([newAlert, ...alerts]);
          onLogUpdate('Alerta Hidráulica IoT', `Manguitos hidráulicos en ${m.name} superaron el 75% de tolerancia.`);
        }
      }

      return {
        ...m,
        status,
        wearIndicators: {
          hydraulics: newHydraulics,
          tractionTires: newTires,
          brakesLine: newBrakes,
          batteryHealth: newSoh
        }
      };
    }));
  };

  // Preventative maintenance repair trigger
  const repairMachine = (machineId: string) => {
    setFleet(prev => prev.map(m => {
      if (m.id !== machineId) return m;

      onLogUpdate(
        'Reparación en Tiempo Real',
        `Reengrasado y recalibración de sensores de "${m.name}". Se sustituyeron neumáticos y frenos consumidos.`
      );

      return {
        ...m,
        status: 'operational',
        wearIndicators: {
          hydraulics: 5.0,
          tractionTires: 8.0,
          brakesLine: 4.5,
          batteryHealth: 99.0
        }
      };
    }));

    // Resolve respective alerts
    onAlertsChange(alerts.filter(a => a.machineId !== machineId));
  };

  // Schedule technical repair of Talleres y Recambios
  const handleScheduleService = (alertId: string) => {
    onAlertsChange(alerts.map(a => {
      if (a.id !== alertId) return a;
      onLogUpdate(
        'Mantenimiento Agendado',
        `Soporte oficial de "Carretillas TR" avisado para resolver la sustitución de ${a.component} en ${a.machineName}.`
      );
      return { ...a, status: 'scheduled' };
    }));
  };

  return (
    <div id="iot-panel-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Fleet Telemetry Stats Left side - 7 Columns */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Connection Dashboard bar */}
        <div className="bg-gray-900 border border-gray-850 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isTelemetryLive ? 'bg-red-600/10 text-red-500 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">Transmisión de Datos IoT (LoraWAN)</h4>
                <span className={`w-2 h-2 rounded-full ${isTelemetryLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <p className="text-xs text-gray-400">
                {isTelemetryLive 
                  ? `Recibiendo telemetría en vivo • Frecuencia: cada ${isEnergySavingMode ? '8s (Ahorro)' : '2.5s'}` 
                  : 'Frecuencia pausada temporalmente'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              id="btn-toggle-telemetry"
              onClick={() => setIsTelemetryLive(!isTelemetryLive)}
              className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-800 text-gray-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition border border-gray-800"
            >
              {isTelemetryLive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-500" /> Pausar IoT
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} /> Reanudar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fleet Grid / Status list */}
        <div id="fleet-telemetry-grid" className="bg-gray-900 border border-gray-850 p-5 rounded-xl shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-500" /> Monitoreo de Flota Activa Sincronizada
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {fleet.map((machine) => {
              const isSelected = selectedMachineId === machine.id;
              
              // status helpers
              const statusColors = {
                operational: 'border-emerald-500/20 bg-emerald-950/5 text-emerald-400',
                warning: 'border-amber-500/30 bg-amber-950/10 text-amber-500',
                critical: 'border-red-600/30 bg-red-950/10 text-red-500 animate-pulse',
                maintenance: 'border-blue-500/20 bg-blue-950/10 text-blue-400',
              };

              return (
                <div
                  id={`machine-card-${machine.id}`}
                  key={machine.id}
                  onClick={() => setSelectedMachineId(machine.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between h-40 group relative overflow-hidden ${
                    isSelected 
                      ? 'bg-gradient-to-br from-gray-950 to-gray-900 border-red-600' 
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Decorative tag for brand */}
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-gray-900 border-b border-l border-gray-800 text-[9px] font-bold text-gray-500 rounded-bl">
                    {machine.type} • {machine.brand}
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        machine.status === 'operational' ? 'bg-emerald-500' : machine.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {machine.name}
                    </h5>
                    <span className="text-[10px] text-gray-500 block font-mono">ID: {machine.id}</span>
                  </div>

                  {/* Operational Telemetry Items */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-900 font-mono text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-gray-500 text-[8px] uppercase block">Batería</span>
                      <span className={`font-bold flex items-center gap-0.5 ${machine.batteryPct < 20 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                        <Battery className="w-3.5 h-3.5 text-gray-400" /> {machine.batteryPct}%
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-gray-500 text-[8px] uppercase block">Velocidad</span>
                      <span className="font-bold text-gray-300 text-left">
                        {machine.speedKmh} km/h
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-gray-500 text-[8px] uppercase block">Motor</span>
                      <span className={`font-bold flex items-center gap-0.5 ${machine.temperature > 65 ? 'text-amber-500 font-extrabold' : 'text-gray-300'}`}>
                        <Thermometer className="w-3.5 h-3.5 text-gray-400" /> {machine.temperature}°C
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-gray-500">Horas: <strong>{machine.totalHours}h</strong></span>
                    
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColors[machine.status]}`}>
                      {machine.status === 'operational' && 'Funcionamiento OK'}
                      {machine.status === 'warning' && 'Mantenimiento Preventivo'}
                      {machine.status === 'critical' && 'Parada Recomendada'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Component Details & Predictive Wear Engine Right side - 5 columns */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Specific Active Machine Wear sensors */}
        <div id="machine-wear-monitor" className="bg-gray-900 border border-gray-850 p-5 rounded-xl shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-850">
            <div>
              <span className="text-[10px] text-red-500 uppercase font-black">Sensores de Componentes</span>
              <h3 className="text-sm font-bold text-white">{activeMachine.name}</h3>
            </div>
            <span className="text-[10px] bg-gray-950 font-mono text-gray-400 px-2.5 py-1 rounded border border-gray-800">
              {activeMachine.brand}
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Sensores IoT estiman el desgaste de piezas clave para predecir averías imprevistas y eliminar la inactividad no planificada en el almacén:
          </p>

          {/* Wear Indicators Row */}
          <div className="space-y-3.5">
            {/* Hydraulics */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Bomba y Circuito Hidráulico</span>
                <span className={`font-semibold font-mono ${activeMachine.wearIndicators.hydraulics > 75 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                  {activeMachine.wearIndicators.hydraulics.toFixed(1)}% Desgaste
                </span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden p-0.5 border border-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    activeMachine.wearIndicators.hydraulics > 75 ? 'bg-red-500' : activeMachine.wearIndicators.hydraulics > 55 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${activeMachine.wearIndicators.hydraulics}%` }}
                />
              </div>
            </div>

            {/* Traction Tires */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Neumáticos y Banda de Tracción</span>
                <span className={`font-semibold font-mono ${activeMachine.wearIndicators.tractionTires > 75 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                  {activeMachine.wearIndicators.tractionTires.toFixed(1)}% Desgaste
                </span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden p-0.5 border border-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    activeMachine.wearIndicators.tractionTires > 75 ? 'bg-red-500' : activeMachine.wearIndicators.tractionTires > 55 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${activeMachine.wearIndicators.tractionTires}%` }}
                />
              </div>
            </div>

            {/* Brakes Line */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Línea de Frenado y Fricción</span>
                <span className={`font-semibold font-mono ${activeMachine.wearIndicators.brakesLine > 75 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                  {activeMachine.wearIndicators.brakesLine.toFixed(1)}% Desgaste
                </span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden p-0.5 border border-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    activeMachine.wearIndicators.brakesLine > 75 ? 'bg-red-500' : activeMachine.wearIndicators.brakesLine > 55 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${activeMachine.wearIndicators.brakesLine}%` }}
                />
              </div>
            </div>

            {/* Battery Health (SOH) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Salud de la Batería (SOH)</span>
                <span className="font-semibold font-mono text-emerald-400">
                  {activeMachine.wearIndicators.batteryHealth.toFixed(1)}% Capacidad
                </span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden p-0.5 border border-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${activeMachine.wearIndicators.batteryHealth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              id="btn-simulate-work-wear"
              onClick={() => addWearToMachine(activeMachine.id)}
              className="px-3.5 py-2.5 bg-gray-950 hover:bg-gray-800 text-gray-300 font-semibold rounded-xl text-xs transition duration-150 border border-gray-850 flex items-center justify-center gap-1.5 hover:border-amber-500/20"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Desgastar Muelle
            </button>
            <button
              id="btn-repair-machine"
              onClick={() => repairMachine(activeMachine.id)}
              className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-red-950/20"
            >
              <Wrench className="w-3.5 h-3.5" /> Reparar Unidad
            </button>
          </div>
        </div>

        {/* Maintenance Alerts Log */}
        <div id="maintenance-alerts-widget" className="bg-gray-900 border border-gray-850 p-5 rounded-xl shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-red-500" /> Registro de Alertas Predictivas
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-950 px-2 py-0.5 rounded border border-gray-800 font-mono">
              {alerts.length} activas
            </span>
          </div>

          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs border border-dashed border-gray-800 rounded-lg">
                No hay alertas críticas. Toda la flota opera a pleno rendimiento, garantizando máxima productividad.
              </div>
            ) : (
              alerts.map(alert => {
                const isHigh = alert.severity === 'high';
                const isScheduled = alert.status === 'scheduled';
                return (
                  <div
                    id={`alert-item-${alert.id}`}
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs space-y-2 ${
                      isScheduled 
                        ? 'bg-blue-950/10 border-blue-500/30' 
                        : isHigh 
                        ? 'bg-red-950/15 border-red-600/30' 
                        : 'bg-amber-950/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          isScheduled 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' 
                            : isHigh 
                            ? 'bg-red-600/10 text-red-400 border border-red-500/10' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                        }`}>
                          {isScheduled ? 'Agendado' : isHigh ? 'Crítico (Sustituir)' : 'Alerta'}
                        </span>
                        <h4 className="font-bold text-white mt-1.5 text-xs">{alert.machineName} - {alert.component}</h4>
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">{alert.triggeredAt}</span>
                    </div>

                    <p className="text-gray-400 leading-relaxed text-[11px]">
                      {alert.message}
                    </p>

                    {!isScheduled && (
                      <div className="pt-1 flex gap-2">
                        <button
                          id={`alert-schedule-btn-${alert.id}`}
                          onClick={() => handleScheduleService(alert.id)}
                          className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded text-[10px] font-bold transition duration-150 flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" /> Agendar Servicio Técnico TR
                        </button>
                      </div>
                    )}
                    {isScheduled && (
                      <p className="text-[10px] text-blue-400 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Equipo oficial TR llegará mañana a taller. Sincronizado.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
