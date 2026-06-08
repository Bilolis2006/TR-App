/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WarehouseParams } from '../types';
import { CATALOG_PRESETS } from '../data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Zap, Leaf, Euro, BatteryCharging, Trophy, ShieldAlert } from 'lucide-react';

interface EnergyEfficiencyProps {
  currentParams: WarehouseParams;
  onLogUpdate: (action: string, details: string) => void;
}

export default function EnergyEfficiency({ currentParams, onLogUpdate }: EnergyEfficiencyProps) {
  const [electricityCost, setElectricityCost] = useState<number>(0.19); // 0.19 € por kWh

  const { dailyLoadFlow, workingHours } = currentParams;

  // Let's compute some realistic metrics
  // Base fleet required
  const estimFleetSize = Math.max(1, Math.ceil(dailyLoadFlow / 35));

  // Hourly consumption of traditional lead-acid fleet: average ~3.6 kWh per machine
  // Hourly consumption of eco-efficient lithium-on fleet (like BYD): average ~1.9 kWh per machine
  const tradHourlyCons = 3.6;
  const ecoHourlyCons = 1.95;

  const tradDailyConsTotal = estimFleetSize * tradHourlyCons * workingHours;
  const ecoDailyConsTotal = estimFleetSize * ecoHourlyCons * workingHours;

  const dailySavedKwh = tradDailyConsTotal - ecoDailyConsTotal;
  const monthlySavedKwh = dailySavedKwh * 26; // 26 working days a month
  const monthlySavingsEuro = monthlySavedKwh * electricityCost;

  // CO2 conversion factors: Spanish electrical mix average 1kWh = 0.23 kg of CO2 emissions
  const dailySavedCo2Kg = dailySavedKwh * 0.23;
  const monthlySavedCo2Kg = dailySavedCo2Kg * 26;

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setElectricityCost(val);
  };

  // Recharts dynamic mock data across 24h of a day cycle
  const generateChartData = () => {
    const data = [];
    for (let hour = 0; hour < 24; hour += 2) {
      // Activity density curve of a warehouse (muelle peaks after 8:00 and 16:00)
      const activityFactor = hour >= 8 && hour <= 18 
        ? 1.0 + Math.sin((hour - 8) / 3) * 0.4 
        : hour >= 20 || hour <= 4 
        ? 0.35 
        : 0.75;

      const tradCons = Number((tradHourlyCons * estimFleetSize * activityFactor).toFixed(1));
      const ecoCons = Number((ecoHourlyCons * estimFleetSize * activityFactor).toFixed(1));

      data.push({
        name: `${hour}:00`,
        'Flota Tradicional (Plomo/Gas)': tradCons,
        'Flota Ecológica BYD Litio-on': ecoCons,
        Ahorro: Number((tradCons - ecoCons).toFixed(1))
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div id="energy-efficiency-root" className="space-y-6">
      
      {/* Dynamic Grid Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cost Savings */}
        <div id="widget-energy-money" className="bg-gray-900 border border-gray-850 p-4.5 rounded-xl text-xs space-y-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium uppercase text-[9px] tracking-wider">Ahorro Mensual Proyectado</span>
            <div className="p-1 px-1.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/10 font-mono font-bold">
              -{(100 - (ecoHourlyCons/tradHourlyCons)*100).toFixed(0)}%
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-amber-500 tracking-tight flex items-baseline gap-1">
              {monthlySavingsEuro.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-sm font-semibold">€</span>
            </span>
            <span className="text-[10px] text-gray-500 block">Con tarifa de {electricityCost} €/kWh</span>
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1">
            <Euro className="w-3.5 h-3.5 text-gray-500" /> Basado en flota de {estimFleetSize} uds.
          </div>
        </div>

        {/* Energy Savings */}
        <div id="widget-energy-saved-kwh" className="bg-gray-900 border border-gray-850 p-4.5 rounded-xl text-xs space-y-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium uppercase text-[9px] tracking-wider">Energía Recuperada</span>
            <Zap className="w-4 h-4 text-red-500" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-red-500 tracking-tight flex items-baseline gap-1">
              {monthlySavedKwh.toFixed(0)}<span className="text-sm font-semibold">kWh</span>
            </span>
            <span className="text-[10px] text-gray-500 block">Evitada en pérdidas de efecto Joule</span>
          </div>
          <div className="text-[10px] text-gray-400">
            Ahorro diario: <strong>{dailySavedKwh.toFixed(1)} kWh</strong> de energía.
          </div>
        </div>

        {/* CO2 Emissions */}
        <div id="widget-energy-co2" className="bg-gray-900 border border-gray-850 p-4.5 rounded-xl text-xs space-y-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium uppercase text-[9px] tracking-wider">Reducción Huella de Carbono</span>
            <Leaf className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-emerald-400 tracking-tight flex items-baseline gap-1">
              {(monthlySavedCo2Kg / 1000).toFixed(2)}<span className="text-sm font-semibold">T CO₂</span>
            </span>
            <span className="text-[10px] text-gray-500 block">CO2 evitado mensualmente</span>
          </div>
          <div className="text-[10px] text-gray-400">
            Equivale a plantar <strong>{((monthlySavedCo2Kg / 1000) * 45).toFixed(0)} árboles</strong> al año.
          </div>
        </div>

        {/* Charging Speed Factor */}
        <div id="widget-energy-charge" className="bg-gray-900 border border-gray-850 p-4.5 rounded-xl text-xs space-y-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl rounded-full" />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium uppercase text-[9px] tracking-wider">Velocidad de Carga BYD</span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-semibold px-2 py-0.5 rounded border border-cyan-500/10">Ultra-Fast</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-blue-400 tracking-tight flex items-baseline gap-1">
              1.5<span className="text-sm font-semibold">h</span>
            </span>
            <span className="text-[10px] text-gray-500">Para el 100% (BYD LiFePO4)</span>
          </div>
          <div className="text-[10px] text-gray-400">
            Tecnología convencional requiere 8 horas.
          </div>
        </div>

      </div>

      {/* Grid of Interactive Charts & Cost Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Energy Chart Line - 8 Columns */}
        <div id="energy-curve-chart" className="lg:col-span-8 bg-gray-900 border border-gray-850 p-5 rounded-2xl shadow-md min-h-[350px] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-red-500" /> Curva de Consumo Energético Estimado Diario (24h)
            </h3>
            <p className="text-[11px] text-gray-500">
              Uso proyectado del parque móvil en base a la intensidad de flujos del muelle y la eficiencia de baterías.
            </p>
          </div>

          <div className="w-full h-64 bg-gray-950/30 p-2.5 rounded-xl border border-gray-850">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEco" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis stroke="#666" style={{ fontSize: 9, fontFamily: 'monospace' }} unit=" kW" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#222', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="Flota Tradicional (Plomo/Gas)" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Flota Ecológica BYD Litio-on" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEco)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Electricity rates controls - 4 Columns */}
        <div id="electricity-rate-calculator" className="lg:col-span-4 bg-gray-900 border border-gray-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] text-amber-500 font-extrabold uppercase">CALCULADORA DE COSTES</span>
            <h3 className="text-sm font-bold text-white">Configurar Gastos Técnicos</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Modifica la tarifa eléctrica contratada por tu empresa para auditar con exactitud el retorno de inversión (ROI) al transicionar hacia tecnologías BYD Liti-on:
            </p>
          </div>

          <div className="space-y-4 py-3 bg-gray-950 p-3.5 rounded-xl border border-gray-850">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block">Precio de la Luz (€ por kWh)</label>
              <div className="relative">
                <input
                  id="electricity-cost-input"
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="1.5"
                  value={electricityCost}
                  onChange={handleCostChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 focus:border-red-600 focus:outline-none rounded-lg text-xs font-mono text-white text-center pb-2.5"
                />
                <span className="absolute right-3.5 top-2.5 text-[10px] text-gray-500">€/kWh</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Pérdida promedio Plomo-Ácido:</span>
              <span className="font-mono text-red-400 font-bold">25% (calor)</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Eficiencia de carga BYD:</span>
              <span className="font-mono text-emerald-400 font-bold">98% (frío)</span>
            </div>
          </div>

          {/* Efficiency Trophy Badge */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/20 to-transparent border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <strong className="text-white block font-bold">Incentivo BYD Litio-on</strong>
              <span className="text-gray-400 text-[10px]">Carga directa sin sala de baterías especial ni paradas de 8 horas.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
