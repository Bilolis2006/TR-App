/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WarehouseParams {
  dailyLoadFlow: number; // in Tons
  avgLoadPerTrip: number; // in Tons
  avgTravelTime: number; // in Minutes per round trip
  loadingUnloadingTime: number; // in Minutes per trip
  workingHours: number; // hours per day (default 8, 16 or 24)
  machEfficiency: number; // operational efficiency factor (0.5 to 1.0)
  batteryAutonomy: number; // hours of battery life
}

export interface CalculatedResults {
  totalTripsNeeded: number;
  timePerTripMinutes: number;
  tripsPerForkliftPerDay: number;
  theoreticalForklifts: number;
  recommendedForklifts: number;
  loadFlowUtil: number; // percent of max load flow
  requiredBatteries: number; // extra batteries needed for continuous flow
}

export interface ForkliftIoT {
  id: string;
  name: string;
  type: 'Frontal' | 'Retráctil' | 'Transpaleta' | 'Apilador';
  brand: 'CAT' | 'BYD Liti-on' | 'MB' | 'TR Custom';
  status: 'operational' | 'warning' | 'critical' | 'maintenance';
  batteryPct: number; // charge %
  temperature: number; // celsius of motor/joints
  speedKmh: number;
  totalHours: number;
  wearIndicators: {
    hydraulics: number; // 0% (new) to 100% (worn out)
    tractionTires: number;
    brakesLine: number;
    batteryHealth: number; // original capacity %
  };
}

export interface MaintenanceAlert {
  id: string;
  machineId: string;
  machineName: string;
  component: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  triggeredAt: string;
  status: 'pending' | 'scheduled' | 'resolved';
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  active: boolean;
}

export interface RevisionLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface DocumentState {
  title: string;
  content: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  companyName: string;
  description: string;
  location: string;
  industry: string;
  logoColor: string;
  params: WarehouseParams;
  fleet: ForkliftIoT[];
  alerts: MaintenanceAlert[];
}

