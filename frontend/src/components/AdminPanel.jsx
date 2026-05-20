import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Package, 
  ShoppingBag, 
  Settings, 
  RefreshCw, 
  Search, 
  AlertTriangle,
  Plus,
  Minus,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function AdminPanel() {
  const {
    rawProducts,
    orders,
    sheetUrl,
    saveSheetUrl,
    updateProductStock,
    updateOrderStatus,
    forceSync
  } = useStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('la_familia_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [urlInput, setUrlInput] = useState(sheetUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingStockId, setEditingStockId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState(0);

  // Pagination for inventory table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Handle simulated login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('la_familia_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('la_familia_admin_auth');
  };

  // Filter raw products based on search term
  const filteredProducts = rawProducts.filter(p => 
    p.nombre?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    p.categoria?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await forceSync();
      setToast({ message: '¡Catálogo actualizado correctamente!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Error de conexión con la planilla de Google Sheets.', type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveUrl = () => {
    saveSheetUrl(urlInput);
    alert('URL de planilla guardada y actualizada.');
  };

  const startEditingStock = (p) => {
    setEditingStockId(p.id);
    setTempStockValue(p.stock !== undefined ? p.stock : 50);
  };

  const saveInlineStock = (id) => {
    updateProductStock(id, parseInt(tempStockValue) || 0);
    setEditingStockId(null);
  };

  // Check if stock is low (e.g. less than 5 units or 2kg/2000g)
  const isLowStock = (p) => {
    const stockVal = p.stock !== undefined ? p.stock : 50;
    if (p.peso?.toLowerCase()?.includes('kilo') || p.peso?.toLowerCase()?.includes('kg')) {
      return stockVal <= 2; // Under 2 kilos is low
    }
    return stockVal < 5; // Under 5 units is low
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-white">
        <div className="w-full max-w-md bg-white border border-dark-100 rounded-3xl p-8 shadow-soft-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-lime-50 text-lime-600 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-outfit text-xl font-bold text-dark-900 text-center">
              Acceso Administrativo
            </h1>
            <p className="text-[11px] text-dark-400 text-center mt-1">
              Ingresá tus credenciales para administrar La Familia.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: admin"
                className="w-full px-4 py-3 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500 bg-white"
                required
              />
            </div>

            {loginError && (
              <p className="text-[11px] text-red-500 font-semibold text-center mt-1">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-lime-500 hover:bg-lime-600 text-white font-bold text-xs tracking-wider rounded-xl transition-all duration-300 shadow-md mt-6"
            >
              INICIAR SESIÓN
            </button>
          </form>

          <div className="border-t border-dark-100 mt-6 pt-6 text-center">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); window.location.pathname = '/'; }}
              className="inline-flex items-center gap-1.5 text-xs text-dark-500 hover:text-dark-800 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Tienda Pública</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dark-100 pb-6 mb-8">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold text-dark-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs text-dark-400 font-light mt-1">
            Administración de catálogo, alertas de stock e historial de pedidos.
          </p>
        </div>

        {/* Sync now trigger & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-lime-500 text-white rounded-xl text-xs font-bold tracking-wider hover:bg-lime-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR AHORA'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold tracking-wider transition-colors"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'inventory' 
              ? 'border-lime-500 text-lime-700 bg-lime-50/20' 
              : 'border-transparent text-dark-500 hover:text-dark-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>INVENTARIO & STOCK</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'orders' 
              ? 'border-lime-500 text-lime-700 bg-lime-50/20' 
              : 'border-transparent text-dark-500 hover:text-dark-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>PEDIDOS REGISTRADOS ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'settings' 
              ? 'border-lime-500 text-lime-700 bg-lime-50/20' 
              : 'border-transparent text-dark-500 hover:text-dark-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>CONFIGURACIÓN DE PLANILLA</span>
        </button>
      </div>

      {/* TAB CONTENT: Inventory & Stock */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Search bar inside admin */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-dark-100">
            <div className="relative w-full sm:max-w-xs flex items-center bg-dark-50 border border-dark-200 rounded-xl focus-within:border-lime-500 transition-colors">
              <Search className="w-4 h-4 text-dark-400 ml-3 absolute pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar por nombre o rubro..."
                className="w-full pl-9 pr-4 py-2 bg-transparent text-xs text-dark-800 outline-none"
              />
            </div>
            <div className="text-[10px] font-medium text-dark-400 uppercase tracking-wider">
              Mostrando {filteredProducts.length} productos flat
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-dark-100 shadow-soft overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="bg-dark-50/70 border-b border-dark-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Medida</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Existencias</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-dark-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {paginatedProducts.map((p) => {
                  const low = isLowStock(p);
                  const isEditing = editingStockId === p.id;
                  
                  return (
                    <tr key={p.id} className="hover:bg-dark-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-dark-500">#{p.id}</td>
                      <td className="px-6 py-4 text-xs text-dark-600 font-medium capitalize">{p.categoria}</td>
                      <td className="px-6 py-4 text-xs font-bold text-dark-800">{p.nombre}</td>
                      <td className="px-6 py-4 text-xs text-dark-500 font-medium">{p.peso}</td>
                      <td className="px-6 py-4 text-xs font-extrabold text-dark-850">
                        ${p.precio.toLocaleString('es-AR')}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 px-2 py-1 border border-dark-300 rounded text-xs outline-none focus:border-lime-500"
                            />
                            <button
                              onClick={() => saveInlineStock(p.id)}
                              className="px-2 py-1 bg-lime-600 text-white rounded text-[10px] font-bold"
                            >
                              Listo
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => startEditingStock(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer hover:bg-dark-100 transition-colors ${
                              low 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}
                          >
                            {low && <AlertTriangle className="w-3.5 h-3.5" />}
                            <span className="font-bold">{p.stock !== undefined ? p.stock : 50}</span>
                            <span className="text-[9px] font-light">
                              {low ? '(Reponer)' : 'Disponible'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => updateProductStock(p.id, Math.max(0, (p.stock !== undefined ? p.stock : 50) + 10))}
                            className="p-1 border border-dark-200 hover:bg-dark-50 rounded-lg text-dark-600"
                            title="Sumar 10 unidades"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => updateProductStock(p.id, Math.max(0, (p.stock !== undefined ? p.stock : 50) - 5))}
                            className="p-1 border border-dark-200 hover:bg-dark-50 rounded-lg text-dark-600"
                            title="Restar 5 unidades"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-dark-200 hover:bg-dark-50 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-xs text-dark-500 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-dark-200 hover:bg-dark-50 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dark-100 rounded-3xl shadow-soft">
              <ShoppingBag className="w-12 h-12 text-dark-300 mx-auto mb-4" />
              <h3 className="font-outfit font-bold text-dark-800 text-sm">Sin pedidos registrados</h3>
              <p className="text-xs text-dark-400 font-light mt-1">
                Cuando los clientes realicen compras, verás los resúmenes aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((o) => (
                <div 
                  key={o.id} 
                  className="bg-white border border-dark-100 rounded-3xl p-6 shadow-soft space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-dark-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-dark-800">
                          Orden #{o.id}
                        </span>
                        <span className="text-[10px] text-dark-400">
                          {new Date(o.fecha).toLocaleDateString('es-AR')} a las {new Date(o.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-dark-600 font-medium mt-1">
                        Cliente: {o.cliente.nombre} ({o.cliente.telefono}) - {o.cliente.email}
                      </p>
                    </div>

                    {/* Status Dropdown selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-dark-400 uppercase">Estado:</label>
                      <select
                        value={o.estado}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className={`px-3 py-1.5 border rounded-full text-xs font-bold outline-none cursor-pointer ${
                          o.estado === 'Pendiente' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                          o.estado === 'Armado/Preparado' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          'bg-green-50 border-green-200 text-green-700'
                        }`}
                      >
                        <option value="Pendiente">⏳ Pendiente</option>
                        <option value="Armado/Preparado">📦 Armado/Preparado</option>
                        <option value="Entregado/Enviado">🚚 Entregado/Enviado</option>
                      </select>
                    </div>
                  </div>

                  {/* Order Body Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Items Bullet List */}
                    <div className="md:col-span-2 space-y-2">
                      <h4 className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Productos de la orden</h4>
                      <ul className="space-y-1 text-xs">
                        {o.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between border-b border-dark-50 pb-1.5 text-dark-700">
                            <span>
                              {item.cantidad}x <strong className="text-dark-800">{item.nombre}</strong> ({item.peso})
                            </span>
                            <span className="font-semibold">${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Logistics and Total Info */}
                    <div className="bg-dark-50/50 rounded-2xl p-4 space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-dark-400 uppercase tracking-widest block mb-1">
                          Dirección de Envío / Retiro
                        </span>
                        <p className="text-xs text-dark-700 font-medium">
                          {o.direccion}
                        </p>
                      </div>

                      {o.notas && (
                        <div>
                          <span className="text-[9px] font-bold text-dark-400 uppercase tracking-widest block mb-0.5">
                            Comentarios
                          </span>
                          <p className="text-xs text-dark-500 font-light italic">
                            "{o.notas}"
                          </p>
                        </div>
                      )}

                      <div className="border-t border-dark-200/50 pt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-dark-800">Total Recaudado</span>
                        <span className="text-sm font-black text-black">
                          ${o.total.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Google Sheets Configurations */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-dark-100 rounded-3xl p-8 shadow-soft max-w-2xl">
          <h3 className="font-outfit text-lg font-bold text-dark-900 mb-2">
            Configuración de Hoja de Cálculo
          </h3>
          <p className="text-xs text-dark-400 font-light mb-6">
            Ingresá el enlace de publicación CSV de tu Google Sheets para importar el inventario en tiempo real. 
            El enlace debe terminar en <code className="bg-dark-50 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-dark-600">output=csv</code>.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1.5">
                URL de publicación CSV de Google Sheets
              </label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={3}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-3 border border-dark-200 rounded-xl text-xs outline-none focus:border-lime-500 bg-white font-mono"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveUrl}
                className="px-6 py-2.5 bg-dark-900 hover:bg-dark-800 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Guardar URL
              </button>
              
              <button
                onClick={() => setUrlInput('https://docs.google.com/spreadsheets/d/e/2PACX-1vTpKijmFFMP1Ea4_wT1_X7bkoFQqIl1XbO73ywCDkDq2ImDOE6dqQ272Sa_nZOw8-Eu7hrISgcLCS5h/pub?gid=2102913718&single=true&output=csv')}
                className="px-6 py-2.5 border border-dark-200 hover:bg-dark-50 text-dark-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Restablecer por Defecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white border shadow-premium p-4 rounded-2xl flex items-center gap-3 animate-toast-in ${
          toast.type === 'success' ? 'border-lime-200' : 'border-red-200'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            toast.type === 'success' ? 'bg-lime-50 text-lime-600' : 'bg-red-50 text-red-600'
          }`}>
            {toast.type === 'success' ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <AlertTriangle className="w-4.5 h-4.5" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-dark-800">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
