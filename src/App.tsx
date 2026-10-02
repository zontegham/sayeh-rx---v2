/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TransmitterTab, 
  Language, 
  AuditLog, 
  TransmitterCoreConfig 
} from './types/index';
import { Navbar } from './components/Navbar';
import { Transmitter } from './components/Transmitter';
import { IntegrationHub } from './components/IntegrationHub';
import { KeyVault } from './components/KeyVault';
import { TransferHistory } from './components/TransferHistory';
import { TransmitterCoreSettings } from './components/TransmitterCoreSettings';
import { OfflinePwaExportModal } from './components/OfflinePwaExportModal';
import { WorkflowWizardModal, WizardConfig } from './components/WorkflowWizardModal';
import { useTheme } from './context/ThemeContext';
import { 
  HelpCircle, 
  Radio
} from 'lucide-react';

export default function App() {
  const { theme } = useTheme();
  const [lang, setLang] = useState<Language>('fa');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // 1. Core-Specific Navigation Tabs for Dedicated Transmitter
  const [activeTab, setActiveTab] = useState<TransmitterTab>(() => {
    try {
      const saved = localStorage.getItem('sayeh_tx_active_tab') as TransmitterTab;
      if (saved) return saved;
    } catch {}
    return 'optical_tx';
  });

  useEffect(() => {
    try {
      localStorage.setItem('sayeh_tx_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Sync document title and html attributes
  useEffect(() => {
    try {
      document.title = lang === 'fa' 
        ? 'سایه - ایستگاه فرستنده سامانه امن یکسویه هوشمند' 
        : 'Sayeh - Intelligent Secure Unidirectional Transmitter Station';
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    } catch {}
  }, [lang]);

  // 2. Transmitter Core Configuration (پیکربندی اختصاصی هسته فرستنده)
  const [txConfig, setTxConfig] = useState<TransmitterCoreConfig>(() => {
    try {
      const saved = localStorage.getItem('sayeh_tx_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      stationId: 'TX-CORE-DIODE-01',
      stationName: 'ایستگاه فرستنده سامانه امن یکسویه هوشمند',
      defaultFps: 3,
      defaultChunkSize: 240,
      defaultErrorCorrection: 'L',
      defaultDisplayCount: 1,
      lockAsDedicatedSender: true,
      requireManualStartOnNewFile: true,
    };
  });

  const handleSaveTxConfig = (updated: TransmitterCoreConfig) => {
    setTxConfig(updated);
    try {
      localStorage.setItem('sayeh_tx_config', JSON.stringify(updated));
    } catch {}
  };

  // 3. Cryptographic Key for Transmitter (مخزن کلیدهای رمزنگاری فرستنده)
  const [activeTxKey, setActiveTxKey] = useState<string>(() => {
    return localStorage.getItem('sayeh_active_tx_key') || 'Sayeh#SecureKey2026!';
  });

  useEffect(() => {
    try {
      localStorage.setItem('sayeh_active_tx_key', activeTxKey);
    } catch {}
  }, [activeTxKey]);

  // 4. Transmission Audit Logs (سوابق و لاگ‌های ارسال)
  const [txLogs, setTxLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('sayeh_tx_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const handleAddTxAuditLog = useCallback((newLog: AuditLog) => {
    setTxLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 100);
      try {
        localStorage.setItem('sayeh_tx_audit_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleClearTxLogs = () => {
    setTxLogs([]);
    try {
      localStorage.removeItem('sayeh_tx_audit_logs');
    } catch {}
  };

  // Cross-component states & Payload Injection from Hub or Wizard
  const [injectedPayload, setInjectedPayload] = useState<string | null>(null);

  // Workflow Wizard Modal
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardConfig, setWizardConfig] = useState<WizardConfig | null>(null);

  // Standalone PWA / Deployment Guide Modal
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendToTransmitter = (payload: string) => {
    setInjectedPayload(payload);
    setActiveTab('optical_tx');
  };

  const handleFinishWizard = (config: WizardConfig) => {
    setWizardConfig(config);
    setActiveTab('optical_tx');
    if (config.passphrase) {
      setActiveTxKey(config.passphrase);
    }
    setIsWizardOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-800 dark:selection:text-emerald-200 transition-colors duration-200">
      {/* Top Station Navigation & Dedicated Transmitter Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        isOnline={isOnline}
        onOpenWizard={() => setIsWizardOpen(true)}
      />

      {/* Main Content Area: Renders the active transmitter tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'optical_tx' && (
          <Transmitter
            lang={lang}
            onLogAudit={handleAddTxAuditLog}
            injectedPayload={injectedPayload}
            onClearInjectedPayload={() => setInjectedPayload(null)}
            wizardConfig={wizardConfig}
            onOpenWizard={() => setIsWizardOpen(true)}
            requireManualStartOnNewFile={txConfig.requireManualStartOnNewFile !== false}
            defaultCyclesPerItem={txConfig.defaultCyclesPerItem}
            defaultAutoAdvance={txConfig.defaultAutoAdvance}
            defaultChromaMode={txConfig.defaultChromaMode}
            defaultAntiGlareTheme={txConfig.defaultAntiGlareTheme}
          />
        )}

        {activeTab === 'inbound_hub' && (
          <IntegrationHub
            lang={lang}
            onSendToTransmitter={handleSendToTransmitter}
          />
        )}

        {activeTab === 'keys_tx' && (
          <KeyVault
            lang={lang}
            activeKeyHex={activeTxKey}
            onSelectKey={(k) => {
              setActiveTxKey(k);
              setActiveTab('optical_tx');
            }}
          />
        )}

        {activeTab === 'history_tx' && (
          <TransferHistory
            lang={lang}
            logs={txLogs}
            onClearLogs={handleClearTxLogs}
          />
        )}

        {activeTab === 'settings_tx' && (
          <TransmitterCoreSettings
            lang={lang}
            config={txConfig}
            onSaveConfig={handleSaveTxConfig}
            onExportStandaloneTx={() => setIsGuideOpen(true)}
          />
        )}
      </main>

      {/* Bottom Status / Footer Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/80 py-4 px-4 sm:px-6 text-xs text-slate-800 dark:text-slate-200 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-1 rounded font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              {lang === 'fa' ? 'ایستگاه فرستنده نوری اختصاصی' : 'Dedicated Optical TX Core'}
            </span>

            <span className="text-[11px] text-slate-700 dark:text-slate-300">
              {lang === 'fa' ? 'تمامی حقوق مادی و معنوی این سامانه متعلق به شرکت ژئوتک می‌باشد.' : 'All rights reserved for Geotech Company.'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'fa' ? 'راهنمای راه‌اندازی آفلاین Air-Gap' : 'Offline Air-Gap Setup Guide'}</span>
            </button>

            <span className="text-slate-600 dark:text-slate-400 font-bold font-mono">v3.2.0 (Dedicated TX)</span>
          </div>
        </div>
      </footer>

      {/* Offline Deployment & PWA Export Modal */}
      <OfflinePwaExportModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        lang={lang}
      />

      {/* Step-by-Step Workflow Onboarding Wizard Modal */}
      <WorkflowWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        lang={lang}
        onFinishWizard={handleFinishWizard}
      />
    </div>
  );
}
