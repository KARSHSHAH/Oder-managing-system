import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const PurchaseBillUpload = () => {
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchase, setPurchase] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosClient.get('/products');
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      }
    };
    fetchProducts();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || loading) return;

    const formData = new FormData();
    formData.append('billImage', file);

    setLoading(true);
    setMessage('');
    try {
      const res = await axiosClient.post('/purchases/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setPurchase(res.data.data);
        setMessage('Bill uploaded and OCR complete. Please review the items below.');
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Failed to upload and process bill';
      setMessage(errorMsg);
    }
    setLoading(false);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchase.items];
    updatedItems[index][field] = value;
    setPurchase({ ...purchase, items: updatedItems });
  };

  const handleToggleSelect = (index, isChecked) => {
    const updatedItems = [...purchase.items];
    updatedItems[index].isSelected = isChecked;
    setPurchase({ ...purchase, items: updatedItems });
  };

  const handleToggleNewProduct = (index, isChecked) => {
    const updatedItems = [...purchase.items];
    const item = updatedItems[index];
    item.isNewProduct = isChecked;
    if (isChecked) {
      item.newProductName = item.itemName || '';
      item.newVariantSku = item.size ? `SKU-${item.size.toUpperCase()}-${Date.now().toString().slice(-4)}` : `SKU-${Date.now().toString().slice(-4)}`;
    }
    setPurchase({ ...purchase, items: updatedItems });
  };

  const handleConfirm = async () => {
    const selectedItems = purchase.items.filter(item => item.isSelected);
    
    if (selectedItems.length === 0) {
      setMessage('Please select at least one item to confirm.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.put(`/purchases/${purchase._id}/confirm`, {
        items: selectedItems,
        supplierName: purchase.supplierName,
        billDate: purchase.billDate
      });
      if (res.data.success) {
        const { updatedCount, newCount } = res.data.summary || { updatedCount: 0, newCount: 0 };
        setMessage(`Purchase confirmed! Stock updated for ${updatedCount} variants, and ${newCount} new products created.`);
        setPurchase(null);
        setFile(null);
      }
    } catch (error) {
      console.error(error);
      setMessage('Failed to confirm purchase');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Purchase Bill (OCR)</h1>
      
      {message && <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">{message}</div>}

      {!purchase && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded shadow-md max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Bill Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border p-2 rounded" />
          </div>
          <button type="submit" disabled={!file || loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Processing OCR...' : 'Upload & Scan'}
          </button>
        </form>
      )}

      {purchase && (
        <div className="bg-white p-6 rounded shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">Review Extracted Items</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm">Supplier Name</label>
              <input type="text" value={purchase.supplierName} onChange={e => setPurchase({...purchase, supplierName: e.target.value})} className="border p-1 w-full" />
            </div>
            <div>
              <label className="block text-sm">Bill Date</label>
              <input type="date" value={purchase.billDate ? new Date(purchase.billDate).toISOString().split('T')[0] : ''} onChange={e => setPurchase({...purchase, billDate: e.target.value})} className="border p-1 w-full" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Draft Items (Pending Confirmation)</h3>
            {purchase.items.length === 0 ? (
              <p className="text-gray-500 italic">No items found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-200">
                      <th className="p-2 text-left w-10">Select</th>
                      <th className="p-2 text-left">Raw OCR Text</th>
                      <th className="p-2 text-left">Product / Match</th>
                      <th className="p-2 text-left">Variant SKU</th>
                      <th className="p-2 text-left">Qty</th>
                      <th className="p-2 text-left">Unit</th>
                      <th className="p-2 text-left">Cost Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items.map((item, index) => {
                      const isUnmatched = !item.matchedProduct && !item.isNewProduct;
                      return (
                      <tr key={index} className={`border-b ${isUnmatched ? 'bg-red-50' : ''}`}>
                        <td className="p-2 text-center">
                          <input type="checkbox" checked={!!item.isSelected} onChange={e => handleToggleSelect(index, e.target.checked)} className="w-4 h-4" />
                        </td>
                        <td className="p-2 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis" title={item.rawText}>
                          {item.rawText}
                          {(item.size || item.color) && (
                            <div className="text-xs text-blue-500 font-medium mt-1">
                              {item.size && <span className="mr-2">Size: {item.size.toUpperCase()}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center mb-1">
                            <input type="checkbox" id={`new-${index}`} checked={item.isNewProduct} onChange={e => handleToggleNewProduct(index, e.target.checked)} className="mr-1" />
                            <label htmlFor={`new-${index}`} className="text-xs text-red-600 font-semibold">New Product — Not in Catalog</label>
                          </div>
                          {item.isNewProduct ? (
                            <div className="text-sm text-gray-500 italic mt-1">
                              (Will be automatically created)
                            </div>
                          ) : (
                            <select value={item.matchedProduct || ''} onChange={e => {
                              const val = e.target.value;
                              handleItemChange(index, 'matchedProduct', val);
                              const prod = products.find(p => p._id === val);
                              if (prod && prod.variants.length > 0) {
                                handleItemChange(index, 'matchedVariantSku', prod.variants[0].sku);
                              }
                            }} className="border p-1 w-full text-sm rounded bg-white">
                              <option value="">Select Product...</option>
                              {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-2">
                          {item.isNewProduct ? (
                             <span className="text-gray-400 text-sm">N/A</span>
                          ) : (
                            <select value={item.matchedVariantSku || ''} onChange={e => handleItemChange(index, 'matchedVariantSku', e.target.value)} className="border p-1 w-full text-sm rounded bg-white">
                              <option value="">Select Variant...</option>
                              {products.find(p => p._id === item.matchedProduct)?.variants.map(v => (
                                <option key={v.sku} value={v.sku}>{v.sku} ({v.weight})</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-2"><input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} className="border p-1 w-20 text-sm rounded" /></td>
                        <td className="p-2">
                          <select value={item.unitType} onChange={e => handleItemChange(index, 'unitType', e.target.value)} className="border p-1 text-sm rounded bg-white">
                            <option value="Pcs">Pcs</option>
                            <option value="Box">Box</option>
                            <option value="Pack">Pack</option>
                          </select>
                        </td>
                        <td className="p-2"><input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} className="border p-1 w-24 text-sm rounded" /></td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex gap-4">
            <button onClick={handleConfirm} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Confirming...' : 'Confirm & Add to Stock'}
            </button>
            <button onClick={() => { setPurchase(null); setFile(null); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseBillUpload;
