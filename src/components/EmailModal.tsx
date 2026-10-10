import React, { useState } from 'react';
import { Mail, Check, Copy, Download, ExternalLink, X, FileSpreadsheet, Send } from 'lucide-react';
import { EmailData } from '../utils/emailHelper';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: EmailData | null;
  onDownloadAgain?: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  emailData,
  onDownloadAgain
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !emailData) return null;

  const handleCopy = () => {
    const fullText = `Kime: ${emailData.to}\nKonu: ${emailData.subject}\n\n${emailData.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">E-posta Raporu Gönderimi</h3>
              <p className="text-xs text-blue-100">Rapor hazırlandı ve Excel dosyası indirildi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* File Download Notice */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold">{emailData.fileName}</span>
                <span className="text-emerald-700 ml-1">otomatik olarak cihazınıza indirildi.</span>
              </div>
            </div>
            {onDownloadAgain && (
              <button
                onClick={onDownloadAgain}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Tekrar İndir
              </button>
            )}
          </div>

          {/* Email Info */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-500 font-medium sm:w-24">Alıcı:</span>
              <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex-1">
                {emailData.to}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-500 font-medium sm:w-24">Konu:</span>
              <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex-1">
                {emailData.subject}
              </span>
            </div>
          </div>

          {/* Email Body Preview */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                E-posta Metin Önizlemesi
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Metni Kopyala
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={emailData.body}
              rows={9}
              className="w-full text-xs font-mono bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-700 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 justify-between items-center">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Panoya Kopyalandı' : 'Tümünü Kopyala'}
          </button>

          <div className="flex gap-2">
            <a
              href={emailData.gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-red-500" /> Web Gmail
            </a>
            <a
              href={emailData.mailtoUrl}
              className="px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg shadow-blue-200"
            >
              <Send className="w-4 h-4" /> Mail İstemcisinde Aç
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
