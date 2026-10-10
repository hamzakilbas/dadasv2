import React from 'react';
import { Download, FolderArchive, Terminal, Play, CheckCircle2, X, ExternalLink } from 'lucide-react';

interface DownloadZipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadZipModal: React.FC<DownloadZipModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = '/posmaster-proje.zip';
    a.download = 'posmaster-proje.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FolderArchive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Projeyi Bilgisayarına İndir</h3>
              <p className="text-xs text-blue-100">Tüm kaynak kodlar hazır paketlendi (ZIP)</p>
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
        <div className="p-6 space-y-5">
          {/* Main Download Button */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Aşağıdaki butona tıklayarak projenin eksiksiz kaynak kodlarını bilgisayarınıza ZIP olarak indirebilirsiniz:
            </p>
            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-md shadow-blue-200 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>posmaster-proje.zip Dosyasını İndir</span>
            </button>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
              Bilgisayarınızda Çalıştırma Adımları:
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-800">ZIP Dosyasını Çıkartın</p>
                  <p className="text-slate-500 mt-0.5">
                    İndirilen <code>posmaster-proje.zip</code> dosyasına sağ tıklayıp bir klasöre çıkartın.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-800">Paketleri Yükleyin</p>
                  <p className="text-slate-500 mt-0.5">
                    Klasör içinde Terminal / Komut Satırı açıp şu komutu çalıştırın:
                  </p>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg mt-1 font-mono text-[11px]">
                    npm install
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-800">Projeyi Başlatın</p>
                  <p className="text-slate-500 mt-0.5">
                    Aynı terminalde şu komutu yazın:
                  </p>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg mt-1 font-mono text-[11px]">
                    npm run dev
                  </code>
                  <p className="text-slate-500 mt-1">
                    Tarayıcınızda <code>http://localhost:3000</code> açılacaktır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
