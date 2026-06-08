/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WarehouseParams, CalculatedResults, ForkliftIoT, MaintenanceAlert, Collaborator, RevisionLog, ClientProfile } from './types';

// Default presets for Talleres y Recambios catalog
export interface ForkliftPreset {
  id: string;
  name: string;
  brand: 'BYD Liti-on' | 'CAT' | 'MB';
  type: 'Frontal' | 'Retráctil' | 'Transpaleta' | 'Apilador';
  nominalCapacity: number; // tons
  batteryType: string;
  autonomyHours: number;
  consumptionKwh: number; // energy usage level per hour
  ecoFactor: number; // 0 (traditional) to 1 (max eco BYD litio)
}

export const CATALOG_PRESETS: ForkliftPreset[] = [
  {
    id: 'cat-ep25CA',
    name: 'CAT EP25CA',
    brand: 'CAT',
    type: 'Frontal',
    nominalCapacity: 2.5,
    batteryType: 'Plomo-Ácido Standard',
    autonomyHours: 6.5,
    consumptionKwh: 3.8,
    ecoFactor: 0.3
  },
  {
    id: 'byd-ecb20',
    name: 'BYD ECB20 Litio',
    brand: 'BYD Liti-on',
    type: 'Frontal',
    nominalCapacity: 2.0,
    batteryType: 'Litio Hierro-Fosfato (LiFePO4)',
    autonomyHours: 9.0,
    consumptionKwh: 2.1, // BYD super efficient
    ecoFactor: 0.95
  },
  {
    id: 'byd-rtr16',
    name: 'BYD Retráctil RTR16',
    brand: 'BYD Liti-on',
    type: 'Retráctil',
    nominalCapacity: 1.6,
    batteryType: 'Litio Hierro-Fosfato (LiFePO4)',
    autonomyHours: 10.0,
    consumptionKwh: 1.8,
    ecoFactor: 1.0
  },
  {
    id: 'mb-reach-premium',
    name: 'MB Reach Premium',
    brand: 'MB',
    type: 'Retráctil',
    nominalCapacity: 1.8,
    batteryType: 'Plomo-Ácido Extra',
    autonomyHours: 7.0,
    consumptionKwh: 3.2,
    ecoFactor: 0.4
  },
  {
    id: 'byd-p12',
    name: 'BYD Transpaleta Eléctrica P12',
    brand: 'BYD Liti-on',
    type: 'Transpaleta',
    nominalCapacity: 1.2,
    batteryType: 'Litio Rápido',
    autonomyHours: 12.0,
    consumptionKwh: 0.9,
    ecoFactor: 0.98
  }
];

export const INITIAL_PARAMS: WarehouseParams = {
  dailyLoadFlow: 150, // 150 Tons a día
  avgLoadPerTrip: 1.5, // 1.5 Tons por ciclo
  avgTravelTime: 4.5, // 4.5 minutos ida y vuelta
  loadingUnloadingTime: 1.5, // 1.5 minutos carga/descarga
  workingHours: 16, // Dos turnos de 8 horas = 16h
  machEfficiency: 0.85, // 85% de eficiencia
  batteryAutonomy: 8.0, // 8 horas de batería promedio
};

export function calculateFleet(params: WarehouseParams): CalculatedResults {
  const {
    dailyLoadFlow,
    avgLoadPerTrip,
    avgTravelTime,
    loadingUnloadingTime,
    workingHours,
    machEfficiency,
    batteryAutonomy
  } = params;

  // Total de viajes necesarios
  const totalTripsNeeded = Math.ceil(dailyLoadFlow / (avgLoadPerTrip || 1));
  
  // Tiempo por viaje en minutos
  const timePerTripMinutes = avgTravelTime + loadingUnloadingTime;
  
  // Viajes factibles por carretilla al día considerando eficiencia
  const tripsPerForkliftPerDay = Math.floor(
    ((workingHours * 60) * machEfficiency) / (timePerTripMinutes || 1)
  );

  // Cantidad teórica de máquinas
  const theoreticalForklifts = tripsPerForkliftPerDay > 0 
    ? totalTripsNeeded / tripsPerForkliftPerDay 
    : 0;

  // Cantidad recomendada: redondear hacia arriba con un margen de seguridad de 15% para cubrir hora punta
  const recommendedForklifts = Math.max(1, Math.ceil(theoreticalForklifts * 1.15));

  // Capacidad de flujo utilizado (%)
  const totalCapacityTons = (recommendedForklifts * tripsPerForkliftPerDay) * avgLoadPerTrip;
  const loadFlowUtil = totalCapacityTons > 0 ? (dailyLoadFlow / totalCapacityTons) * 100 : 0;

  // Baterías requeridas
  // Si las horas de trabajo superan la autonomía se necesitan baterías de recambio para máquinas tradicionales,
  // o cargas rápidas de oportunidad (en las de Litio). Para máquinas estándar, requerimos relevo de batería.
  const requiredBatteries = workingHours > batteryAutonomy
    ? Math.ceil(recommendedForklifts * (workingHours / batteryAutonomy))
    : recommendedForklifts;

  return {
    totalTripsNeeded,
    timePerTripMinutes,
    tripsPerForkliftPerDay,
    theoreticalForklifts,
    recommendedForklifts,
    loadFlowUtil,
    requiredBatteries
  };
}

// Initial active fleet with sensors telemetry
export const INITIAL_FLEET: ForkliftIoT[] = [
  {
    id: 'TR-FLEET-01',
    name: 'Carretilla Frontal E1',
    type: 'Frontal',
    brand: 'BYD Liti-on',
    status: 'operational',
    batteryPct: 82,
    temperature: 34,
    speedKmh: 6.5,
    totalHours: 1240,
    wearIndicators: {
      hydraulics: 12.5,
      tractionTires: 32.1,
      brakesLine: 18.2,
      batteryHealth: 98 // BYD batteries degradate extremely slowly
    }
  },
  {
    id: 'TR-FLEET-02',
    name: 'Retráctil Pasillo Alto R2',
    type: 'Retráctil',
    brand: 'CAT',
    status: 'warning',
    batteryPct: 45,
    temperature: 58, // hot motor
    speedKmh: 4.8,
    totalHours: 3410,
    wearIndicators: {
      hydraulics: 72.8, // hydraulics reaching warning limit
      tractionTires: 61.4,
      brakesLine: 78.4,  // brake pads very worn
      batteryHealth: 81
    }
  },
  {
    id: 'TR-FLEET-03',
    name: 'Carretilla Pesada F3',
    type: 'Frontal',
    brand: 'CAT',
    status: 'operational',
    batteryPct: 91,
    temperature: 41,
    speedKmh: 8.2,
    totalHours: 852,
    wearIndicators: {
      hydraulics: 14.1,
      tractionTires: 19.5,
      brakesLine: 24.3,
      batteryHealth: 96
    }
  },
  {
    id: 'TR-FLEET-04',
    name: 'Preparadora Pedidos T4',
    type: 'Transpaleta',
    brand: 'BYD Liti-on',
    status: 'critical',
    batteryPct: 14, // low battery critical warning
    temperature: 28,
    speedKmh: 2.5,
    totalHours: 2150,
    wearIndicators: {
      hydraulics: 38.2,
      tractionTires: 81.3, // Tires need imminent replacement
      brakesLine: 43.1,
      batteryHealth: 94
    }
  },
  {
    id: 'TR-FLEET-05',
    name: 'Apilador Compacto A5',
    type: 'Apilador',
    brand: 'MB',
    status: 'operational',
    batteryPct: 67,
    temperature: 32,
    speedKmh: 3.5,
    totalHours: 1845,
    wearIndicators: {
      hydraulics: 45.0,
      tractionTires: 28.5,
      brakesLine: 52.0,
      batteryHealth: 88
    }
  }
];

export const INITIAL_ALERTS: MaintenanceAlert[] = [
  {
    id: 'ALT-101',
    machineId: 'TR-FLEET-02',
    machineName: 'Retráctil Pasillo Alto R2',
    component: 'Zapatas de Freno',
    severity: 'high',
    message: 'El detector de fricción indica menos de 1.8mm en la zapata derecha. Desgaste crítico (78.4%).',
    triggeredAt: 'Hace 2 horas',
    status: 'pending'
  },
  {
    id: 'ALT-102',
    machineId: 'TR-FLEET-04',
    machineName: 'Preparadora Pedidos T4',
    component: 'Neumático de Tracción',
    severity: 'medium',
    message: 'Vibraciones de rodadura detectadas por giroscopio IoT. Desgaste en banda neumática de tracción (81.3%).',
    triggeredAt: 'Hoy, 08:30',
    status: 'pending'
  },
  {
    id: 'ALT-103',
    machineId: 'TR-FLEET-02',
    machineName: 'Retráctil Pasillo Alto R2',
    component: 'Bomba Hidráulica',
    severity: 'low',
    message: 'Presión fuera del rango ideal durante inclinación de mástil. Desgaste del convertidor de flujo hidráulico (72.8%).',
    triggeredAt: 'Ayer',
    status: 'scheduled'
  }
];

export const INITIAL_COLLABORATORS: Collaborator[] = [
  { id: 'usr-1', name: 'Carlos Díaz (Logística)', role: 'Director de Almacén', avatarColor: 'bg-red-600', active: true },
  { id: 'usr-2', name: 'Laura Gómez (TR)', role: 'Soporte Técnico TR', avatarColor: 'bg-amber-500', active: true },
  { id: 'usr-3', name: 'Ing. Mateo Ruiz', role: 'Gestión Flotas Intralogística', avatarColor: 'bg-blue-600', active: false },
  { id: 'usr-4', name: 'Tú', role: 'Administrador Local', avatarColor: 'bg-emerald-600', active: true }
];

export const INITIAL_REVISION_LOGS: RevisionLog[] = [
  {
    id: 'rev-01',
    timestamp: '2026-06-08 19:35',
    user: 'Carlos Díaz',
    action: 'Parámetros Modificados',
    details: 'Se subió el Flujo de Carga Diario de 120T a 150T por expansión del muelle de descarga.'
  },
  {
    id: 'rev-02',
    timestamp: '2026-06-08 18:02',
    user: 'Laura Gómez (TR)',
    action: 'Mantenimiento Agendado',
    details: 'Coordinado reemplazo de neumático y zapatas para el tractor T4 y R2 para mañana a las 7:00.'
  },
  {
    id: 'rev-03',
    timestamp: '2026-06-08 15:40',
    user: 'Sistema IoT',
    action: 'Registro Automático',
    details: 'Sensores de temperatura calibrados en carretillas eléctricas de Litio BYD.'
  }
];

export const DEMO_CLIENTS: ClientProfile[] = [
  {
    id: 'client-mediterraneo',
    name: 'Logística Mediterránea',
    companyName: 'Almacenes Logísticos del Mediterráneo S.L.',
    description: 'Distribuidor logístico general multicliente en puerto. Operaciones de flujo medio y alta variabilidad de paquetería.',
    location: 'Puerto de Valencia • Terminal 4',
    industry: 'Operador Logístico / 3PL',
    logoColor: 'bg-red-600',
    params: {
      dailyLoadFlow: 150,
      avgLoadPerTrip: 1.5,
      avgTravelTime: 4.5,
      loadingUnloadingTime: 1.5,
      workingHours: 16,
      machEfficiency: 0.85,
      batteryAutonomy: 8.0
    },
    fleet: [
      {
        id: 'TR-FLEET-01',
        name: 'Carretilla Frontal E1',
        type: 'Frontal',
        brand: 'BYD Liti-on',
        status: 'operational',
        batteryPct: 82,
        temperature: 34,
        speedKmh: 6.5,
        totalHours: 1240,
        wearIndicators: {
          hydraulics: 12.5,
          tractionTires: 32.1,
          brakesLine: 18.2,
          batteryHealth: 98
        }
      },
      {
        id: 'TR-FLEET-02',
        name: 'Retráctil Pasillo Alto R2',
        type: 'Retráctil',
        brand: 'CAT',
        status: 'warning',
        batteryPct: 45,
        temperature: 58,
        speedKmh: 4.8,
        totalHours: 3410,
        wearIndicators: {
          hydraulics: 72.8,
          tractionTires: 61.4,
          brakesLine: 78.4,
          batteryHealth: 81
        }
      },
      {
        id: 'TR-FLEET-03',
        name: 'Carretilla Pesada F3',
        type: 'Frontal',
        brand: 'CAT',
        status: 'operational',
        batteryPct: 91,
        temperature: 41,
        speedKmh: 8.2,
        totalHours: 852,
        wearIndicators: {
          hydraulics: 14.1,
          tractionTires: 19.5,
          brakesLine: 24.3,
          batteryHealth: 96
        }
      },
      {
        id: 'TR-FLEET-04',
        name: 'Preparadora Pedidos T4',
        type: 'Transpaleta',
        brand: 'BYD Liti-on',
        status: 'critical',
        batteryPct: 14,
        temperature: 28,
        speedKmh: 2.5,
        totalHours: 2150,
        wearIndicators: {
          hydraulics: 38.2,
          tractionTires: 81.3,
          brakesLine: 43.1,
          batteryHealth: 94
        }
      }
    ],
    alerts: [
      {
        id: 'ALT-101',
        machineId: 'TR-FLEET-02',
        machineName: 'Retráctil Pasillo Alto R2',
        component: 'Zapatas de Freno',
        severity: 'high',
        message: 'El detector de fricción indica menos de 1.8mm en la zapata derecha. Desgaste crítico (78.4%).',
        triggeredAt: 'Hace 2 horas',
        status: 'pending'
      },
      {
        id: 'ALT-102',
        machineId: 'TR-FLEET-04',
        machineName: 'Preparadora Pedidos T4',
        component: 'Neumático de Tracción',
        severity: 'medium',
        message: 'Vibraciones de rodadura detectadas por giroscopio IoT. Desgaste en banda neumática de tracción (81.3%).',
        triggeredAt: 'Hoy, 08:30',
        status: 'pending'
      }
    ]
  },
  {
    id: 'client-cantabrico',
    name: 'Frío del Cantábrico',
    companyName: 'Frío del Cantábrico S.A.',
    description: 'Instalaciones frigoríficas industriales. Operación al vacío térmico a -25ºC que degrada aceleradamente la eficiencia de baterías de plomo tradicionales y requiere carretillas retráctiles y de muelle cerrado.',
    location: 'ZAL Burgos • Bloque Refrigerado F5',
    industry: 'Alimentación Congelada / Frío Industrial',
    logoColor: 'bg-cyan-600',
    params: {
      dailyLoadFlow: 290,
      avgLoadPerTrip: 1.8,
      avgTravelTime: 6.0,
      loadingUnloadingTime: 2.2,
      workingHours: 24, // 3 turnos rotativos
      machEfficiency: 0.75, // Tracción reducida por el suelo deslizante de salas frías
      batteryAutonomy: 5.5 // Severa bajada de autonomía en plomo tradicional (exige paso a litio calefactado)
    },
    fleet: [
      {
        id: 'TR-COLD-01',
        name: 'BYD Frigo Retráctil FC1',
        type: 'Retráctil',
        brand: 'BYD Liti-on',
        status: 'operational',
        batteryPct: 96,
        temperature: -18, // Subzero!
        speedKmh: 4.5,
        totalHours: 980,
        wearIndicators: {
          hydraulics: 10.4,
          tractionTires: 14.8,
          brakesLine: 12.1,
          batteryHealth: 100 // lithium handles smart thermal packs
        }
      },
      {
        id: 'TR-COLD-02',
        name: 'Transpaleta Frigo FC2',
        type: 'Transpaleta',
        brand: 'BYD Liti-on',
        status: 'operational',
        batteryPct: 54,
        temperature: -21,
        speedKmh: 3.2,
        totalHours: 1920,
        wearIndicators: {
          hydraulics: 24.5,
          tractionTires: 38.0,
          brakesLine: 15.6,
          batteryHealth: 97
        }
      },
      {
        id: 'TR-COLD-03',
        name: 'Caterpillar Polar FC3',
        type: 'Frontal',
        brand: 'CAT',
        status: 'warning',
        batteryPct: 22,
        temperature: -15,
        speedKmh: 5.0,
        totalHours: 4890,
        wearIndicators: {
          hydraulics: 68.4, // lubricants are freezing up or thickening
          tractionTires: 42.1,
          brakesLine: 52.8,
          batteryHealth: 68 // heavy health loss due to charging plomo in -25C
        }
      }
    ],
    alerts: [
      {
        id: 'ALT-COLD-01',
        machineId: 'TR-COLD-03',
        machineName: 'Caterpillar Polar FC3',
        component: 'Fluido Hidráulico Criogénico',
        severity: 'medium',
        message: 'Presión de bombeo inestable. Viscosidad del fluido por debajo del umbral óptimo debido a baja temperatura permanente.',
        triggeredAt: 'Hace 45 minutos',
        status: 'pending'
      }
    ]
  },
  {
    id: 'client-susaeta',
    name: 'Aceros Susaeta',
    companyName: 'Fundición y Aceros Susaeta Hnos. S.A.',
    description: 'Siderurgia de alta exigencia y transporte de coladas de metal pesadas en hornos de fundición. Entorno contaminado con polvo de grafito y temperaturas extremas de radiación térmica.',
    location: 'Polígono Industrial Malpica • Zaragoza',
    industry: 'Metalurgia / Siderurgia Pesada',
    logoColor: 'bg-orange-700',
    params: {
      dailyLoadFlow: 520,
      avgLoadPerTrip: 3.5, // bobinas de acero pesado
      avgTravelTime: 8.0, // distancias gigantescas de acería
      loadingUnloadingTime: 2.5,
      workingHours: 8, // un único turno exhaustivo de flujo masivo
      machEfficiency: 0.85,
      batteryAutonomy: 9.0
    },
    fleet: [
      {
        id: 'TR-STEEL-01',
        name: 'CAT EP25 Heavy Frontal S1',
        type: 'Frontal',
        brand: 'CAT',
        status: 'critical',
        batteryPct: 42,
        temperature: 78, // Overheating hazard!
        speedKmh: 7.8,
        totalHours: 6200,
        wearIndicators: {
          hydraulics: 89.2, // critical hydraulics wear
          tractionTires: 55.4,
          brakesLine: 82.5, // brakes thermal stress
          batteryHealth: 74
        }
      },
      {
        id: 'TR-STEEL-02',
        name: 'CAT EP25 Heavy Frontal S2',
        type: 'Frontal',
        brand: 'CAT',
        status: 'warning',
        batteryPct: 77,
        temperature: 64,
        speedKmh: 6.9,
        totalHours: 5800,
        wearIndicators: {
          hydraulics: 54.0,
          tractionTires: 48.0,
          brakesLine: 69.1,
          batteryHealth: 78
        }
      },
      {
        id: 'TR-STEEL-03',
        name: 'Perno de Carga MB S3',
        type: 'Apilador',
        brand: 'MB',
        status: 'operational',
        batteryPct: 89,
        temperature: 42,
        speedKmh: 3.5,
        totalHours: 1940,
        wearIndicators: {
          hydraulics: 34.1,
          tractionTires: 22.8,
          brakesLine: 29.5,
          batteryHealth: 88
        }
      }
    ],
    alerts: [
      {
        id: 'ALT-STEEL-01',
        machineId: 'TR-STEEL-01',
        machineName: 'CAT EP25 Heavy Frontal S1',
        component: 'Línea Hidráulica de Elevación',
        severity: 'high',
        message: 'Temperatura del circuito excedió el límite crítico de 75°C. Viscosidad reducida riesgo de fuga imprevista.',
        triggeredAt: 'Hace 1 hora',
        status: 'pending'
      },
      {
        id: 'ALT-STEEL-02',
        machineId: 'TR-STEEL-01',
        machineName: 'CAT EP25 Heavy Frontal S1',
        component: 'Pastillas de Freno Térmicas',
        severity: 'high',
        message: 'Detector de fatiga por calor detectó micro-fricciones duraderas. Regenerador de frenado saturado.',
        triggeredAt: 'Hace 3 horas',
        status: 'pending'
      }
    ]
  }
];

