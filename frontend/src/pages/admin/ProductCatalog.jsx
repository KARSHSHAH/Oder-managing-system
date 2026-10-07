import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import { Plus, Trash2, Edit, Search, Layers, AlertTriangle } from 'lucide-react';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const initialFormState = {
    name: '',
    brand: '',
    category: 'Bra',
    description: '',
    hsnCode: '',
    gstRate: 0,
    isActive: true,
    variants: [
      { size: '', color: '', sku: '', unitType: 'Pcs', packSize: 1, stockQty: 50, wholesaleRate: 100, mrp: 150, costPrice: 70 },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/products', {
        params: { search: search || undefined, category: categoryFilter || undefined },
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  // Variant row manipulations
  const addVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { size: '', color: '', sku: '', unitType: 'Pcs', packSize: 1, stockQty: 50, wholesaleRate: 100, mrp: 150, costPrice: 70 },
      ],
    }));
  };

  const removeVariantRow = (index) => {
    if (formData.variants.length === 1) {
      alert('A product must have at least one variant row.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/products', formData);
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      description: prod.description || '',
      hsnCode: prod.hsnCode || '',
      gstRate: prod.gstRate || 0,
      isActive: prod.isActive,
      variants: prod.variants.map((v) => ({
        size: v.size || '',
        color: v.color || '',
        sku: v.sku || '',
        unitType: v.unitType || 'Pcs',
        packSize: v.packSize || 1,
        stockQty: v.stockQty,
        wholesaleRate: v.wholesaleRate,
        mrp: v.mrp || 0,
        costPrice: v.costPrice || 0,
      })),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/products/${editingProduct._id}`, formData);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosClient.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Product Catalog & Inventory</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Manage wholesale undergarment lines with multi-attribute variants, rates & profit margins
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            >
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by product name, brand, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.3rem' }}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Bra">Bra</option>
              <option value="Brief">Brief</option>
              <option value="Vest">Vest</option>
              <option value="Trunk">Trunk</option>
              <option value="Bloomers">Bloomers</option>
              <option value="Camisole">Camisole</option>
              <option value="Thermal">Thermal Innerwear</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Product & Brand</th>
                <th>Category</th>
                <th>Variants & Stock Breakdown</th>
                <th>Total Stock</th>
                <th>Wholesale Rates</th>
                <th>Cost Price (Admin)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No products found. Click "+ Add New Product" to create your first item.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const totalStock = p.variants.reduce((acc, v) => acc + (v.stockQty || 0), 0);
                  const minRate = Math.min(...p.variants.map((v) => v.wholesaleRate));
                  const maxRate = Math.max(...p.variants.map((v) => v.wholesaleRate));
                  const minCost = Math.min(...p.variants.map((v) => v.costPrice || 0));
                  const maxCost = Math.max(...p.variants.map((v) => v.costPrice || 0));

                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
                          {p.brand}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {p.variants.map((v, i) => (
                            <div
                              key={i}
                              style={{
                                fontSize: '0.78rem',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{v.sku}:</span>
                              <span>
                                {[v.size, v.color].filter(Boolean).join(' / ') || 'Standard'}
                              </span>
                              <span
                                style={{
                                  color: v.stockQty <= 10 ? '#dc2626' : '#059669',
                                  fontWeight: 700,
                                }}
                              >
                                ({v.stockQty} pcs)
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: totalStock <= 15 ? '#dc2626' : '#0f172a',
                          }}
                        >
                          {totalStock} pcs
                        </span>
                        {totalStock <= 15 && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                            Low inventory
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {minRate === maxRate
                          ? `Rs. ${minRate}`
                          : `Rs. ${minRate} - Rs. ${maxRate}`}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {minCost === maxCost
                          ? `Rs. ${minCost}`
                          : `Rs. ${minCost} - Rs. ${maxCost}`}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleEditClick(p)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="btn btn-secondary btn-sm"
                            title="Delete Product"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Product & Variants' : 'Add New Product (with Flexible Variants)'}
        maxWidth="850px"
      >
        <form onSubmit={isEditModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Lux Cozi Regular Ribbed Men Vest"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <input
                type="text"
                placeholder="e.g. Lux Cozi, Amul Macho, Jockey"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="Bra">Bra (Size + Color)</option>
                <option value="Brief">Brief (Size Only)</option>
                <option value="Vest">Vest (Size Only)</option>
                <option value="Trunk">Trunk</option>
                <option value="Bloomers">Bloomers</option>
                <option value="Camisole">Camisole</option>
                <option value="Thermal">Thermal Set</option>
                <option value="Other">Other / Socks</option>
              </select>
            </div>

            <div className="form-group">
              <label>Product Status</label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
              >
                <option value="active">Active (Available in Catalog)</option>
                <option value="inactive">Inactive / Hidden</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="Fabric composition, features, packing details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-grid" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>HSN Code</label>
              <input
                type="text"
                placeholder="e.g. 6109"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>GST Rate (%)</label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          {/* Dynamic Variant Rows Builder */}
          <div style={{ marginTop: '1.5rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  Flexible Product Variants ({formData.variants.length})
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Add size-only, size+color, or no-variant combinations with independent stock and wholesale rates.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addVariantRow}
                style={{ color: '#2563eb', fontWeight: 600 }}
              >
                <Plus size={14} /> Add Variant Row
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 1fr 40px',
                    gap: 8,
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>SIZE (Opt)</span>
                    <input
                      type="text"
                      placeholder="e.g. 85 cm, M, 34B"
                      value={variant.size}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>COLOR (Opt)</span>
                    <input
                      type="text"
                      placeholder="e.g. White, Black"
                      value={variant.color}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>SKU (Unique)</span>
                    <input
                      type="text"
                      placeholder="Auto or Custom SKU"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>UNIT</span>
                    <select
                      value={variant.unitType}
                      onChange={(e) => handleVariantChange(index, 'unitType', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', width: '100%' }}
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>PACK SIZE</span>
                    <input
                      type="number"
                      value={variant.packSize}
                      onChange={(e) => handleVariantChange(index, 'packSize', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                      min={1}
                      required
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>STOCK QTY</span>
                    <input
                      type="number"
                      value={variant.stockQty}
                      onChange={(e) => handleVariantChange(index, 'stockQty', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                      min={0}
                      required
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb' }}>WHOLESALE (Rs.)</span>
                    <input
                      type="number"
                      value={variant.wholesaleRate}
                      onChange={(e) => handleVariantChange(index, 'wholesaleRate', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}
                      min={0}
                      required
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>COST PRICE (Rs.)</span>
                    <input
                      type="number"
                      value={variant.costPrice}
                      onChange={(e) => handleVariantChange(index, 'costPrice', e.target.value)}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                      min={0}
                    />
                  </div>

                  <div style={{ paddingTop: 14, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeVariantRow(index)}
                      style={{ color: '#ef4444', padding: 4 }}
                      title="Remove variant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '-1.5rem -1.75rem -1.5rem', padding: '1rem 1.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditModalOpen ? 'Save Changes' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductCatalog;
