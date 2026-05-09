import { useState, useEffect } from 'react';
import { stockService } from '../../services/stockService';
import { medicationService } from '../../services/medicationService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export default function StockManagement() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    medicationId: '', quantity: 0, price: 0, threshold: 10
  });
  const [editForm, setEditForm] = useState({
    quantity: 0, price: 0, threshold: 10, isAvailable: true
  });

  const loadData = async () => {
    try {
      const [stockRes, medRes] = await Promise.all([
        stockService.getStock(),
        medicationService.getAll({ limit: 100 }),
      ]);
      setStocks(stockRes.data.data);
      setMedications(medRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stockService.addMedication(form);
      setShowAdd(false);
      setForm({ medicationId: '', quantity: 0, price: 0, threshold: 10 });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Erreur');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await stockService.updateStock(id, editForm);
      setEditId(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Erreur');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          💊 Gestion du Stock ({stocks.length})
        </h2>
        <Button onClick={() => setShowAdd(!showAdd)}>
          + Ajouter médicament
        </Button>
      </div>

      {/* Formulaire ajout */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card mb-6 space-y-3">
          <h3 className="font-semibold text-gray-700">Ajouter un médicament</h3>
          <select
            className="input"
            value={form.medicationId}
            onChange={e => setForm(f => ({ ...f, medicationId: e.target.value }))}
            required
          >
            <option value="">Sélectionner un médicament...</option>
            {medications.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Quantité</label>
              <input type="number" className="input" min="0"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Prix (HTG)</label>
              <input type="number" className="input" min="0" step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Seuil alerte</label>
              <input type="number" className="input" min="0"
                value={form.threshold}
                onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Ajouter</Button>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {/* Liste stock */}
      <div className="space-y-3">
        {stocks.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            Aucun médicament dans votre stock
          </div>
        ) : (
          stocks.map(stock => (
            <div key={stock.id} className="card">
              {editId === stock.id ? (
                // Mode édition
                <div className="space-y-3">
                  <p className="font-semibold text-gray-800">
                    ✏️ {stock.medication.name}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Quantité</label>
                      <input type="number" className="input" min="0"
                        value={editForm.quantity}
                        onChange={e => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Prix (HTG)</label>
                      <input type="number" className="input" step="0.01"
                        value={editForm.price}
                        onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Seuil</label>
                      <input type="number" className="input" min="0"
                        value={editForm.threshold}
                        onChange={e => setEditForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox"
                      checked={editForm.isAvailable}
                      onChange={e => setEditForm(f => ({ ...f, isAvailable: e.target.checked }))}
                    />
                    Disponible
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(stock.id)}>Sauvegarder</Button>
                    <Button variant="secondary" onClick={() => setEditId(null)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                // Mode affichage
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{stock.medication.name}</p>
                    <p className="text-sm text-gray-500">
                      {stock.medication.genericName || stock.medication.category?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-primary-600">
                        {Number(stock.price).toFixed(2)} HTG
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {stock.quantity} / Seuil: {stock.threshold}
                      </p>
                    </div>
                    <Badge variant={
                      stock.quantity === 0 ? 'error' :
                      stock.quantity <= stock.threshold ? 'warning' : 'success'
                    }>
                      {stock.quantity === 0 ? 'Rupture' :
                       stock.quantity <= stock.threshold ? 'Stock faible' : 'Disponible'}
                    </Badge>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditId(stock.id);
                        setEditForm({
                          quantity: stock.quantity,
                          price: Number(stock.price),
                          threshold: stock.threshold,
                          isAvailable: stock.isAvailable,
                        });
                      }}
                    >
                      ✏️
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}