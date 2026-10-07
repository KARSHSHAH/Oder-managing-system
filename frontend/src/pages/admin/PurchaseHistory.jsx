import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';

const PurchaseHistory = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await axiosClient.get('/purchases');
        if (res.data.success) {
          setPurchases(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch purchases', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase History</h1>
        <Link to="/admin/purchases/upload" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Upload New Bill
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : purchases.length === 0 ? (
        <p>No purchase bills found.</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Supplier</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Items Count</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Uploaded By</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(purchase => (
                <tr key={purchase._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm">{new Date(purchase.billDate).toLocaleDateString()}</td>
                  <td className="p-3 text-sm">{purchase.supplierName}</td>
                  <td className="p-3 text-sm">{purchase.items?.length || 0} items</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${purchase.status === 'Added to Stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{purchase.uploadedBy?.name || 'Unknown'}</td>
                  <td className="p-3 text-sm">
                    {purchase.billImage && (
                      <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${purchase.billImage}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Bill Image
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
