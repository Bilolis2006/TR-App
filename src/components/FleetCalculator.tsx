/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WarehouseParams, CalculatedResults } from '../types';
import { CATALOG_PRESETS, ForkliftPreset, calculateFleet, INITIAL_PARAMS } from '../data';
import { Calculator, Truck, HelpCircle, RefreshCw, Layers, Sparkles, Battery, Timer } from 'lucide-react';

interface FleetCalculatorProps {
  onParamsChange: (params: WarehouseParams) => void;
  currentParams: WarehouseParams;
  onLogUpdate: (action: string, details: string) => void;
  onShowToast?: (message: string, type: 'success' | 'info' | 'warn') => void;
}

export default function FleetCalculator({ onParamsChange, currentParams, onLogUpdate, onShowToast }: FleetCalculatorProps) {
  const [params, setParams] = useState<WarehouseParams>(currentParams);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('byd-ecb20');
  const [results, setResults] = useState<CalculatedResults>(calculateFleet(params));

  // Recalculate whenever params modify
  useEffect(() => {
    const res = calculateFleet(params);
    setResults(res);
    onParamsChange(params);
  }, [params]);

  const handleSliderChange = (key: keyof WarehouseParams, val: number) => {
    setParams(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const applyPreset = (preset: ForkliftPreset) => {
    setSelectedPresetId(preset.id);
    const updated = {
      ...params,
      avgLoadPerTrip: preset.nominalCapacity,
      batteryAutonomy: preset.autonomyHours,
    };
    setParams(updated);
    
    onLogUpdate(
      'Preset Seleccionado',
      `Se aplicaron las especificaciones de "${preset.name}" (Capacidad: ${preset.nominalCapacity}T, Autonomía: ${preset.autonomyHours}h).`
    );
  };

  return (
    <div id="fleet-calculator-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Configuration Column - 5 columns */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Presets Selection */}
        <div id="calculator-presets" className="bg-gray-900 border border-gray-850 p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" /> Modelos Disponibles (TR)
            </h3>
            <span className="text-[10px] bg-red-600/15 text-red-500 font-semibold px-2 py-0.5 rounded border border-red-500/10">Catálogo Activo</span>
          </div>
          
          <p className="text-xs text-gray-400">
            Selecciona una máquina del stock certificado de Talleres y Recambios para pre-cargar su capacidad operativa:
          </p>

          <div className="space-y-2.5">
            {CATALOG_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  id={`preset-btn-${preset.id}`}
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-950/20 border-red-600 text-white'
                      : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold block">{preset.name}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${preset.brand === 'BYD Liti-on' ? 'bg-cyan-500' : 'bg-amber-500'}`} />
                      {preset.brand} • {preset.type} • Capacidad: {preset.nominalCapacity} Ton
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-gray-400 font-bold">{preset.autonomyHours}h</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-tight">Autolimitada</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sliders Form */}
        <div id="calculator-inputs" className="bg-gray-900 border border-gray-850 p-5 rounded-xl shadow-md space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-red-500" /> Parámetros del Almacén
          </h3>

          <div className="space-y-5">
            {/* Flujo de Carga Diario */}
            <div className="space-y-2">
              <div className="flex justify-between items-center transition">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  Flujo de Carga Diario
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" title="Toneladas totales a mover por día en el almacén" />
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    id="input-load-flow"
                    type="number"
                    value={params.dailyLoadFlow}
                    onChange={(e) => handleSliderChange('dailyLoadFlow', Number(e.target.value))}
                    className="w-16 bg-gray-950 border border-gray-800 focus:border-red-600 rounded px-1.5 py-0.5 font-mono text-center text-xs text-amber-500"
                  />
                  <span className="text-[10px] text-gray-400 font-bold">Tons</span>
                </div>
              </div>
              <input
                id="range-load-flow"
                type="range"
                min="10"
                max="1000"
                step="10"
                value={params.dailyLoadFlow}
                onChange={(e) => handleSliderChange('dailyLoadFlow', Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-1.5 bg-gray-950 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>10 T/día</span>
                <span>500 T/día</span>
                <span>1000 T/día</span>
              </div>
            </div>

            {/* Capacidad Promedio por ciclo */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  Capacidad de Carga Realizada
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" title="Carga promedio transportada por viaje de máquina" />
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    id="input-load-trip"
                    type="number"
                    step="0.1"
                    value={params.avgLoadPerTrip}
                    onChange={(e) => handleSliderChange('avgLoadPerTrip', Number(e.target.value))}
                    className="w-16 bg-gray-950 border border-gray-800 focus:border-red-600 rounded px-1.5 py-0.5 font-mono text-center text-xs text-amber-500"
                  />
                  <span className="text-[10px] text-gray-400 font-bold">Tons</span>
                </div>
              </div>
              <input
                id="range-load-trip"
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={params.avgLoadPerTrip}
                onChange={(e) => handleSliderChange('avgLoadPerTrip', Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-1.5 bg-gray-950 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0.5 T/viaje</span>
                <span>2.5 T/viaje</span>
                <span>5.0 T/viaje</span>
              </div>
            </div>

            {/* Tiempo de Desplazamiento */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  Tiempo de Viaje Ida/Vuelta
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" title="Tiempo promedio que tarda la máquina en ir y volver sin contar la carga/descarga" />
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    id="input-travel-time"
                    type="number"
                    step="0.5"
                    value={params.avgTravelTime}
                    onChange={(e) => handleSliderChange('avgTravelTime', Number(e.target.value))}
                    className="w-16 bg-gray-950 border border-gray-800 focus:border-red-600 rounded px-1.5 py-0.5 font-mono text-center text-xs text-amber-500"
                  />
                  <span className="text-[10px] text-gray-400 font-bold">Minut.</span>
                </div>
              </div>
              <input
                id="range-travel-time"
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={params.avgTravelTime}
                onChange={(e) => handleSliderChange('avgTravelTime', Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-1.5 bg-gray-950 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>1 min</span>
                <span>10 min</span>
                <span>20 min</span>
              </div>
            </div>

            {/* Tiempo de Carga/Descarga */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  Operatividad Carga/Descarga
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" title="Suma de tiempo de levantar materiales, apilar y asegurar materiales en muelle" />
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    id="input-unloading-time"
                    type="number"
                    step="0.1"
                    value={params.loadingUnloadingTime}
                    onChange={(e) => handleSliderChange('loadingUnloadingTime', Number(e.target.value))}
                    className="w-16 bg-gray-950 border border-gray-800 focus:border-red-600 rounded px-1.5 py-0.5 font-mono text-center text-xs text-amber-500"
                  />
                  <span className="text-[10px] text-gray-400 font-bold">Minut.</span>
                </div>
              </div>
              <input
                id="range-unloading-time"
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={params.loadingUnloadingTime}
                onChange={(e) => handleSliderChange('loadingUnloadingTime', Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-1.5 bg-gray-950 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                <span>0.5 min</span>
                <span>5.0 min</span>
                <span>10.0 min</span>
              </div>
            </div>

            {/* Grid 2 Columns for Shifts & Efficiency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 block">Jornada Diaria</label>
                <select
                  id="select-working-hours"
                  value={params.workingHours}
                  onChange={(e) => handleSliderChange('workingHours', Number(e.target.value))}
                  className="w-full p-2 bg-gray-950 border border-gray-800 focus:border-red-600 rounded-lg text-xs text-white"
                >
                  <option value={8}>1 Turno (8h)</option>
                  <option value={16}>2 Turnos (16h)</option>
                  <option value={24}>3 Turnos (24h)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 block">Eficiencia Flota</label>
                <select
                  id="select-efficiency"
                  value={params.machEfficiency}
                  onChange={(e) => handleSliderChange('machEfficiency', Number(e.target.value))}
                  className="w-full p-2 bg-gray-950 border border-gray-800 focus:border-red-600 rounded-lg text-xs text-white"
                >
                  <option value={0.95}>Máxima (95%)</option>
                  <option value={0.85}>Estándar TR (85%)</option>
                  <option value={0.75}>Restringida (75%)</option>
                  <option value={0.60}>Baja/Tráfico (60%)</option>
                </select>
              </div>
            </div>

            {/* Autonomía de Batería */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300">Autonomía de Batería</label>
                <span className="font-mono text-xs text-amber-500 font-bold">{params.batteryAutonomy}h</span>
              </div>
              <input
                id="range-battery-autonomy"
                type="range"
                min="4"
                max="16"
                step="0.5"
                value={params.batteryAutonomy}
                onChange={(e) => handleSliderChange('batteryAutonomy', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-950 rounded-lg appearance-none"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Results Column - 7 columns */}
      <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
        
        {/* Recommended Units Card */}
        <div id="calculator-recommendation" className="bg-gradient-to-br from-gray-900 to-gray-950 border border-red-600/30 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full space-y-6 shadow-xl">
          
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
          
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">CÁLCULO DE OPERABILIDAD TR</span>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Capacidad Óptima Recomendada</h2>
            </div>
            <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/15">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* Main Huge Number Projection */}
          <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-900">
            <div className="space-y-1 border-r border-gray-900">
              <span className="text-xs text-gray-400 font-medium">Unidades Necesarias</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-amber-500 tracking-tight">
                  {results.recommendedForklifts}
                </span>
                <span className="text-xs font-semibold text-gray-400">máquinas</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Basado en {results.totalTripsNeeded} viajes diarios y un margen de seguridad del 15% para absorber oscilaciones de muelle.
              </p>
            </div>

            <div className="space-y-3 pl-4 flex flex-col justify-center">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-amber-500" /> Tiempo/Ciclo completo:
                </span>
                <span className="font-mono font-bold text-white text-right">{results.timePerTripMinutes.toFixed(1)} min</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} /> Viajes/Máquina día:
                </span>
                <span className="font-mono font-bold text-white text-right">{results.tripsPerForkliftPerDay}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-amber-500" /> Baterías Totales:
                </span>
                <span className="font-mono font-bold text-white text-right">{results.requiredBatteries} uds</span>
              </div>
            </div>
          </div>

          {/* Load Utilization and Safety Info */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-gray-300">Uso Operativo Proyectado de Flota</span>
                <span className="font-mono font-bold text-amber-400">{results.loadFlowUtil.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-900 border border-gray-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    results.loadFlowUtil > 90
                      ? 'bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : results.loadFlowUtil > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, results.loadFlowUtil)}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-900 p-3.5 rounded-lg text-xs space-y-2">
              <span className="font-bold text-white block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-red-500" /> Consejo de Optimización de Técnicos TR:
              </span>
              <p className="text-gray-400 leading-relaxed">
                {results.loadFlowUtil > 90 ? (
                  <strong className="text-red-400">¡Alerta de cuellos de botella!</strong>
                ) : results.loadFlowUtil < 50 ? (
                  <strong className="text-emerald-400">Bajo uso operativo.</strong>
                ) : (
                  <strong className="text-amber-400">Eficiencia equilibrada.</strong>
                )}{' '}
                {results.loadFlowUtil > 90
                  ? 'La flota recomendada operará al límite. Se sugiere ampliar a baterías de Litio de carga ultra-rápida BYD para reducir tiempos muertos de recarga a cero e incorporar turnos dinámicos.'
                  : results.loadFlowUtil < 50
                  ? 'Su capacidad de elevación excede con creces la demanda diaria. Podría alquilar un equipo temporal e implementar la técnica Just-in-Time en el muelle principal.'
                  : 'Su dimensionamiento operativo es idóneo. Para mantener esta rentabilidad constante, integre sensores de fatiga mecánica en los mástiles de tracción y controle la telemetría IoT desde este panel.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              id="btn-print-fleet-report"
              onClick={() => {
                if (onShowToast) {
                  onShowToast(`Informe Generado: Se requieren ${results.recommendedForklifts} carretillas y ${results.requiredBatteries} baterías de repuesto/recarga rápida.`, 'success');
                } else {
                  alert(`Informe Generado: Su almacén requiere un stock de ${results.recommendedForklifts} carretillas certificadas con ${results.requiredBatteries} sistemas de energía.`);
                }
                onLogUpdate('Descarga de Informe', `Exportado informe operativo de flota (${results.recommendedForklifts} unidades registradas en muelle).`);
              }}
              className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition duration-150 shadow-md flex items-center justify-center gap-2"
            >
              Exportar Dimensionamiento de Flota
            </button>
            <button
              id="btn-reset-params"
              onClick={() => {
                setParams(INITIAL_PARAMS);
                setSelectedPresetId('byd-ecb20');
                onLogUpdate('Restablecer Parámetros', 'Parámetros del muelle reiniciados a los valores estándar de fábrica.');
              }}
              className="px-4 bg-gray-900 text-gray-400 hover:text-white rounded-xl border border-gray-800 hover:border-gray-700 text-xs transition flex items-center justify-center"
              title="Restablecer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
