import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Database, Eye, Lock, Mail } from 'lucide-react';

export default function PrivacyModal({ show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            {/* Header - altijd zichtbaar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-slate-800">Privacy & Beveiliging</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Scrollbare content */}
            <div className="overflow-y-auto p-5 space-y-5">
              {/* Welke gegevens */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-bold text-slate-800">Welke gegevens vragen we?</h4>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Gebruikersnaam</span>
                    <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">voornaam.achternaam</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">E-mailadres</span>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">voor ww-reset</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Wachtwoord</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">zelf kiezen</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Dat is alles. Geen telefoonnummer, adres of geboortedatum.</p>
              </div>

              {/* Wat zien teamleden */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-bold text-slate-800">Wat zien teamleden van jou?</h4>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Jouw naam</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Zichtbaar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Aanwezigheid</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Zichtbaar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Notities</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Zichtbaar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">E-mailadres</span>
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">✗ Niet zichtbaar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Wachtwoord</span>
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">✗ Voor niemand</span>
                  </div>
                </div>
              </div>

              {/* Beveiliging */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-bold text-slate-800">Hoe beveiligen we jouw data?</h4>
                </div>
                <div className="space-y-2">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-0.5">Wachtwoord versleuteld</p>
                    <p className="text-xs text-green-700">Je wachtwoord wordt gehashed opgeslagen (bcrypt). Niemand kan het uitlezen.</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-0.5">Toegangscontrole per groep</p>
                    <p className="text-xs text-green-700">Je ziet alleen data van groepen waar je lid van bent (Row Level Security).</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-0.5">Beveiligde verbinding</p>
                    <p className="text-xs text-green-700">Alle communicatie gaat via HTTPS.</p>
                  </div>
                </div>
              </div>

              {/* Wachtwoord vergeten */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-bold text-slate-800">Wachtwoord vergeten?</h4>
                </div>
                <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
                  <p className="text-xs text-sky-800">Je ontvangt automatisch een reset-link op je eigen e-mailadres. Volledig self-service — er komt geen admin aan te pas.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
