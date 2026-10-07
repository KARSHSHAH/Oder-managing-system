import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const ExportToBusy = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exportType, setExportType] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = exportType === 'sales' ? '/export/busy/sales' : '/export/busy/purchase';
      
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await axiosClient.get(endpoint, {
        params,
        responseType: 'blob', // Important for file download
      });

      // Extract filename from Content-Disposition header if possible
      let filename = `busy-${exportType}-export.xlsx`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Export to Busy</h1>
        <p className="page-description">Download sales and purchase data in Busy-compatible Excel format.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label>Export Type</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="radio" 
                  name="exportType" 
                  value="sales" 
                  checked={exportType === 'sales'} 
                  onChange={() => setExportType('sales')} 
                />
                Sales (Delivered Orders)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="radio" 
                  name="exportType" 
                  value="purchase" 
                  checked={exportType === 'purchase'} 
                  onChange={() => setExportType('purchase')} 
                />
                Purchases (OCR Bills)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>From Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>To Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
              />
            </div>
          </div>

          {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating...' : `Export ${exportType === 'sales' ? 'Sales' : 'Purchases'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportToBusy;
