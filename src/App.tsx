import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  initialTables,
  initialProducts,
  initialSettings
} from './data/initialData';
import { Table, Product, OrderItem, OrderSession, AppSettings, PaymentMethod, SessionOrderItem } from './types/pos';
import { normalizeProduct } from './utils/productHelper';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { WaiterView } from './components/WaiterView';
import { TableOrderView } from './components/TableOrderView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { ReportsView } from './components/ReportsView';
import { ManagementView } from './components/ManagementView';
import { ReceiptModal } from './components/ReceiptModal';

const STORAGE_KEY = 'dadas_tatlici_pos_v2';

export default function App() {
  // Application Data States
  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('posmaster_clean_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tables && parsed.tables.length > 0) return parsed.tables;
      }
    } catch (e) {
      console.error(e);
    }
    return initialTables;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('posmaster_clean_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products && parsed.products.length > 0) {
          return parsed.products.map(normalizeProduct);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialProducts.map(normalizeProduct);
  });

  const [orders, setOrders] = useState<Record<string, OrderItem[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('posmaster_clean_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orders) return parsed.orders;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const [orderHistory, setOrderHistory] = useState<OrderSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('posmaster_clean_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.orderHistory)) return parsed.orderHistory;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('posmaster_clean_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) {
          return {
            ...parsed.settings,
            restaurantName: 'Dadaş Tatlıcı'
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialSettings;
  });

  // UI Navigation States
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('waiter');
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Modals
  const [receiptModalSession, setReceiptModalSession] = useState<OrderSession | null>(null);

  // Synchronize state to localStorage whenever it changes
  useEffect(() => {
    try {
      const payload = {
        tables,
        products,
        orders,
        orderHistory,
        settings
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [tables, products, orders, orderHistory, settings]);

  const openOrdersCount = useMemo(() => {
    return Object.keys(orders).filter(k => orders[k] && orders[k].length > 0).length;
  }, [orders]);

  // Active table
  const activeTable = useMemo(() => {
    return tables.find(t => t.id === activeTableId);
  }, [tables, activeTableId]);

  // ================= ORDER / POS ACTIONS =================
  const handleAddItemToActiveTable = (
    productId: string,
    selectedPieces?: number | null,
    totalPieces?: number | null
  ) => {
    if (!activeTableId) return;

    setOrders(prev => {
      const currentList = prev[activeTableId] || [];
      const existingIdx = currentList.findIndex(
        item => item.productId === productId && (item.selectedPieces || null) === (selectedPieces || null)
      );

      if (existingIdx >= 0) {
        const updated = [...currentList];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + 1
        };
        return { ...prev, [activeTableId]: updated };
      } else {
        return {
          ...prev,
          [activeTableId]: [
            ...currentList,
            {
              productId,
              qty: 1,
              selectedPieces: selectedPieces || null,
              totalPieces: totalPieces || null
            }
          ]
        };
      }
    });
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    if (!activeTableId) return;

    setOrders(prev => {
      const currentList = prev[activeTableId] || [];
      if (!currentList[index]) return prev;

      const newQty = currentList[index].qty + delta;
      if (newQty <= 0) {
        const updated = currentList.filter((_, i) => i !== index);
        return { ...prev, [activeTableId]: updated };
      } else {
        const updated = [...currentList];
        updated[index] = { ...updated[index], qty: newQty };
        return { ...prev, [activeTableId]: updated };
      }
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeTableId) return;
    setOrders(prev => {
      const currentList = prev[activeTableId] || [];
      const updated = currentList.filter((_, i) => i !== index);
      return { ...prev, [activeTableId]: updated };
    });
  };

  const handleClearTableOrder = () => {
    if (!activeTableId) return;
    setOrders(prev => {
      const next = { ...prev };
      delete next[activeTableId];
      return next;
    });
  };

  /**
   * PROCESS PAYMENT (Nakit or Kredi Kartı)
   * - Records payment method ('Nakit' | 'Kredi Kartı') per table
   * - Creates single block product summary with prices
   * - Stores completed order into orderHistory
   * - Clears the table
   */
  const handleProcessPayment = (method: PaymentMethod, note?: string) => {
    if (!activeTableId || !activeTable) return;
    const currentOrder = orders[activeTableId] || [];
    if (currentOrder.length === 0) return;

    // 1. Build session items and calculate total
    let totalAmount = 0;
    const sessionItems: SessionOrderItem[] = [];
    const blockParts: string[] = [];
    const detailParts: string[] = [];

    currentOrder.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      let unitPrice = product.price;
      let labelPiece = '';

      if (item.selectedPieces && item.totalPieces) {
        unitPrice = (product.price / item.totalPieces) * item.selectedPieces;
        labelPiece = ` (${item.selectedPieces}/${item.totalPieces} dilim)`;
      }

      const itemTotal = unitPrice * item.qty;
      totalAmount += itemTotal;

      sessionItems.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        qty: item.qty,
        unitPrice,
        selectedPieces: item.selectedPieces,
        totalPieces: item.totalPieces,
        totalPrice: itemTotal
      });

      blockParts.push(`${item.qty}x ${product.name}${labelPiece} (${itemTotal.toFixed(2)} ₺)`);
      detailParts.push(`${product.name}: ${item.qty} ad. x ${unitPrice.toFixed(2)} ₺`);
    });

    const singleBlockProducts = blockParts.join(', ');
    const detailedProductInfo = detailParts.join(' | ');

    // 2. Create the completed order session object
    const newSession: OrderSession = {
      id: `ord-${Date.now()}`,
      tableId: activeTable.id,
      tableName: activeTable.name,
      items: sessionItems,
      totalAmount,
      paymentMethod: method,
      paymentDate: new Date().toISOString(),
      notes: note || undefined,
      singleBlockProducts,
      detailedProductInfo
    };

    // 3. Prepend to Order History
    setOrderHistory(prev => [newSession, ...prev]);

    // 4. Clear table order
    setOrders(prev => {
      const next = { ...prev };
      delete next[activeTableId];
      return next;
    });

    // 5. Close order view and show receipt modal
    setActiveTableId(null);
    setReceiptModalSession(newSession);
  };

  // ================= MANAGEMENT / CRUD ACTIONS =================
  const handleSaveTable = (t: Partial<Table> & { id?: string }) => {
    if (t.id) {
      setTables(prev =>
        prev.map(item => (item.id === t.id ? { ...item, ...t } as Table : item))
      );
    } else {
      const newTable: Table = {
        id: `t-${Date.now()}`,
        name: t.name || 'Yeni Masa',
        section: t.section || 'İç Mekan',
        seq: t.seq || tables.length + 1
      };
      setTables(prev => [...prev, newTable]);
    }
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
    setOrders(prev => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    if (activeTableId === tableId) setActiveTableId(null);
  };

  const handleSaveProduct = (p: Partial<Product> & { id?: string }) => {
    if (p.id) {
      setProducts(prev =>
        prev.map(item => (item.id === p.id ? normalizeProduct({ ...item, ...p }) : item))
      );
    } else {
      const newProduct = normalizeProduct({
        id: `p-${Date.now()}`,
        name: p.name || 'Yeni Ürün',
        category: p.category || 'İçecekler',
        price: p.price || 0,
        img: p.img || ''
      });
      setProducts(prev => [...prev, newProduct]);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setOrders(prev => {
      const updated: Record<string, OrderItem[]> = {};
      Object.keys(prev).forEach(tableId => {
        updated[tableId] = prev[tableId].filter(i => i.productId !== productId);
      });
      return updated;
    });
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    setProducts(prev => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // ================= BACKUP & RESTORE ACTIONS =================
  const handleExportJsonBackup = () => {
    const dataStr = JSON.stringify(
      {
        tables,
        products,
        orders,
        orderHistory,
        settings,
        exportDate: new Date().toISOString()
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dadas_Tatlici_Sistem_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported.tables) && Array.isArray(imported.products)) {
          setTables(imported.tables);
          setProducts(imported.products.map(normalizeProduct));
          setOrders(imported.orders || {});
          if (Array.isArray(imported.orderHistory)) setOrderHistory(imported.orderHistory);
          if (imported.settings) setSettings(imported.settings);
          alert('Sistem verileri ve yedek başarıyla geri yüklendi!');
        } else {
          alert('Geçersiz yedek dosyası!');
        }
      } catch (err) {
        alert('Dosya okunurken bir hata oluştu: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDemo = () => {
    setTables(initialTables);
    setProducts(initialProducts.map(normalizeProduct));
    setOrders({});
    setOrderHistory([]);
    setSettings(initialSettings);
    setActiveTableId(null);
    alert('Sistem başlangıç durumuna sıfırlandı.');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setActiveTableId(null);
        }}
        settings={settings}
        openOrdersCount={openOrdersCount}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* If inside table order view */}
        {activeTab === 'waiter' && activeTable ? (
          <TableOrderView
            table={activeTable}
            products={products}
            orderItems={orders[activeTable.id] || []}
            onBack={() => setActiveTableId(null)}
            onAddItem={handleAddItemToActiveTable}
            onUpdateQty={handleUpdateItemQty}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearTableOrder}
            onProcessPayment={handleProcessPayment}
          />
        ) : activeTab === 'waiter' ? (
          <WaiterView
            tables={tables}
            orders={orders}
            products={products}
            onSelectTable={(tableId) => setActiveTableId(tableId)}
          />
        ) : null}

        {/* ORDER HISTORY VIEW WITH PRODUCT & TABLE FILTERS */}
        {activeTab === 'history' && (
          <OrderHistoryView
            orderHistory={orderHistory}
            products={products}
            tables={tables}
            restaurantName={settings.restaurantName}
            onViewReceipt={(session) => setReceiptModalSession(session)}
          />
        )}

        {/* REPORTS VIEW (Gün Sonu & Aylık Özet) */}
        {activeTab === 'reports' && (
          <ReportsView
            orderHistory={orderHistory}
            products={products}
            settings={settings}
          />
        )}

        {/* MANAGEMENT & SETTINGS VIEW */}
        {activeTab === 'management' && (
          <ManagementView
            tables={tables}
            products={products}
            settings={settings}
            onSaveTable={handleSaveTable}
            onDeleteTable={handleDeleteTable}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onMoveProduct={handleMoveProduct}
            onUpdateSettings={(s) => setSettings(s)}
            onExportJsonBackup={handleExportJsonBackup}
            onImportJsonBackup={handleImportJsonBackup}
            onResetToDemo={handleResetToDemo}
          />
        )}
      </main>

      {/* FOOTER AS REQUESTED BY USER */}
      <footer className="bg-white border-t border-slate-200 py-2.5 px-4 text-center text-xs text-slate-500 font-medium flex-shrink-0 flex items-center justify-center gap-2">
        <span className="font-semibold text-slate-800">Dadaş Tatlıcı</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-600 font-medium">Hamza tarafından geliştirilmiştir.</span>
      </footer>

      {/* Receipt Modal for Viewing/Printing Ticket */}
      <ReceiptModal
        isOpen={!!receiptModalSession}
        onClose={() => setReceiptModalSession(null)}
        session={receiptModalSession}
        settings={settings}
      />
    </div>
  );
}
