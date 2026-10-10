import React, { useState, useMemo } from 'react';
import { Utensils, Filter, CheckCircle2, Clock } from 'lucide-react';
import { Table, Product, OrderItem } from '../types/pos';

interface WaiterViewProps {
  tables: Table[];
  orders: Record<string, OrderItem[]>;
  products: Product[];
  onSelectTable: (tableId: string) => void;
}

export const WaiterView: React.FC<WaiterViewProps> = ({
  tables,
  orders,
  products,
  onSelectTable
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('Tümü');

  const sections = useMemo(() => {
    return ['Tümü', ...Array.from(new Set(tables.map(t => t.section || 'İç Mekan')))];
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (selectedSection === 'Tümü') return tables;
    return tables.filter(t => (t.section || 'İç Mekan') === selectedSection);
  }, [tables, selectedSection]);

  // Fast product price map for O(1) lookups
  const productPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.id, p.price));
    return map;
  }, [products]);

  // Memoized table metrics
  const { totalOccupied, totalOpenAmount, tableDataMap } = useMemo(() => {
    let occupiedCount = 0;
    let openSum = 0;
    const dataMap = new Map<string, { total: number; itemCount: number }>();

    tables.forEach(table => {
      const tableOrders = orders[table.id] || [];
      if (tableOrders.length > 0) {
        occupiedCount += 1;
        let tTotal = 0;
        let tItems = 0;

        tableOrders.forEach(item => {
          tItems += item.qty;
          const basePrice = productPriceMap.get(item.productId) || 0;
          let price = basePrice;
          if (item.selectedPieces && item.totalPieces) {
            price = (basePrice / item.totalPieces) * item.selectedPieces;
          }
          tTotal += price * item.qty;
        });

        openSum += tTotal;
        dataMap.set(table.id, { total: tTotal, itemCount: tItems });
      }
    });

    return {
      totalOccupied: occupiedCount,
      totalOpenAmount: openSum,
      tableDataMap: dataMap
    };
  }, [tables, orders, productPriceMap]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header & Summary Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Masa & Adisyon Ekranı</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sipariş girmek veya hesap kapatmak için ilgili masaya dokunun
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{tables.length - totalOccupied} Boş Masa</span>
            </div>

            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-100 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>{totalOccupied} Dolu Masa</span>
            </div>

            {totalOccupied > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 text-xs font-bold">
                <span>Açık Hesap: ₺{totalOpenAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          {sections.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSection === sec
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredTables.map(table => {
            const tableStats = tableDataMap.get(table.id);
            const isOccupied = !!tableStats;
            const tableTotal = tableStats?.total || 0;
            const totalItemsCount = tableStats?.itemCount || 0;

            return (
              <div
                key={table.id}
                onClick={() => onSelectTable(table.id)}
                className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between aspect-square select-none ${
                  isOccupied
                    ? 'bg-gradient-to-b from-rose-50/80 to-white border-2 border-rose-300 shadow-md shadow-rose-100'
                    : 'bg-white hover:bg-slate-50/80 border-2 border-slate-200/80 hover:border-emerald-300 shadow-xs'
                }`}
              >
                {/* Status indicator dot */}
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {table.section || 'Masa'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOccupied ? (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                </div>

                {/* Center table icon and name */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${
                      isOccupied
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                    }`}
                  >
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-800 text-center leading-tight">
                    {table.name}
                  </h3>
                </div>

                {/* Bottom status & amount */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {isOccupied ? (
                    <>
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {totalItemsCount} Kalem
                      </span>
                      <span className="text-xs font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-lg">
                        ₺{tableTotal.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 w-full justify-center">
                      <CheckCircle2 className="w-3 h-3" /> Boş Masa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
