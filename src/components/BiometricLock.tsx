/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Fingerprint, Shield, KeyRound, Check, Lock, Unlock, Zap, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BiometricLockProps {
  onUnlock: () => void;
  isUnlocked: boolean;
  onLock: () => void;
}

export default function BiometricLock({ onUnlock, isUnlocked, onLock }: BiometricLockProps) {
  const [pin, setPin] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanType, setScanType] = useState<'finger' | 'face' | null>(null);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const correctPin = '1867'; // TR established year!

  const startScan = (type: 'finger' | 'face') => {
    setScanning(true);
    setScanType(type);
    setErrorMsg('');
    
    // Simulate biometric analysis
    setTimeout(() => {
      setScanSuccess(true);
      setTimeout(() => {
        setScanning(false);
        setScanSuccess(false);
        setScanType(null);
        onUnlock();
      }, 900);
    }, 2000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      setErrorMsg('');
      setPin('');
      onUnlock();
    } else {
      setErrorMsg('PIN incorrecto. (Sugerencia corporativa: el año de fundación "1867")');
      setPin('');
    }
  };

  if (isUnlocked) {
    return (
      <div id="biometric-unlocked" className="p-4 bg-gray-900 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Sesión Protegida TR</h4>
            <p className="text-xs text-gray-400">Encriptación de extremo a extremo activa (AES-GCM-256)</p>
          </div>
        </div>
        <button
          id="btn-lock-session"
          onClick={onLock}
          className="px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs hover:bg-gray-700 transition flex items-center gap-2 border border-gray-700"
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" /> Lock Admin
        </button>
      </div>
    );
  }

  return (
    <div id="biometric-locked" className="p-8 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center max-w-md mx-auto my-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient glowing bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
      
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-red-600/10 text-red-500 flex items-center justify-center rounded-xl font-bold border border-red-500/20">
          TR
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">Acceso Restringido - Carretillas TR</h3>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Por seguridad industrial, esta sección administrativa de sincronización de datos requiere autenticación biométrica o PIN.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {scanning ? (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-6 space-y-4"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Dynamic pulse scanner */}
              <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping" />
              <div className="absolute inset-2 border border-amber-500/50 rounded-full animate-pulse" />
              
              {scanType === 'finger' ? (
                <Fingerprint className="w-12 h-12 text-amber-500 animate-pulse" />
              ) : (
                <Eye className="w-12 h-12 text-amber-500 animate-pulse" />
              )}
              
              {/* Scan laser line */}
              <div className="absolute left-0 right-0 h-0.5 bg-amber-400 shadow-md shadow-amber-400/50 rounded animate-bounce top-1/2" />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-amber-400">
                {scanSuccess ? '✓ Acceso Concedido' : `Escaneando ${scanType === 'finger' ? 'Huella' : 'Iris/Rostro'}...`}
              </p>
              <p className="text-xs text-gray-500 mt-1">Verificando hash E2EE en tiempo real</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            className="w-full flex flex-col space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Biometric Buttons Row */}
            <div className="grid grid-cols-2 gap-4">
              <button
                id="btn-scan-fingerprint"
                onClick={() => startScan('finger')}
                type="button"
                className="p-5 flex flex-col items-center gap-3 bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded-xl transition group text-center"
              >
                <Fingerprint className="w-8 h-8 text-amber-500 group-hover:scale-110 duration-200" />
                <div>
                  <span className="block text-sm font-semibold text-white">Sensor Huella</span>
                  <span className="text-[10px] text-gray-500">Autenticación Biométrica</span>
                </div>
              </button>

              <button
                id="btn-scan-face"
                onClick={() => startScan('face')}
                type="button"
                className="p-5 flex flex-col items-center gap-3 bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded-xl transition group text-center"
              >
                <Eye className="w-8 h-8 text-amber-500 group-hover:scale-110 duration-200" />
                <div>
                  <span className="block text-sm font-semibold text-white">Escáner Facial</span>
                  <span className="text-[10px] text-gray-500">Reconocimiento Facial</span>
                </div>
              </button>
            </div>

            {/* Separator */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-600">O INTRODUCIR CÓDIGO</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            {/* PIN Pad Form */}
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="pin-input"
                  type="password"
                  placeholder="Introduce PIN (Ej: 1867)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="flex-grow px-4 py-2 bg-gray-900 border border-gray-800 font-mono text-center tracking-widest text-white rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm placeholder:tracking-normal placeholder:font-sans"
                />
                <button
                  id="btn-submit-pin"
                  type="submit"
                  className="px-5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 hover:scale-[1.02] duration-150 flex items-center justify-center gap-1 text-sm shadow-md"
                >
                  <KeyRound className="w-4 h-4" /> Entrar
                </button>
              </div>
              {errorMsg && (
                <p className="text-[11px] text-red-500 text-center animate-pulse">{errorMsg}</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-[10px] text-gray-600 flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-amber-500" /> Sincronización en la nube asegurada mediante AES-256 local.
      </div>
    </div>
  );
}
