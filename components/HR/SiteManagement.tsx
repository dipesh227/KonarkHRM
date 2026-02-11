import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Site } from '../../types';
import { MapPin, Plus, Building, Users, MoreVertical, Edit, Trash2, UserCircle, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SiteManagement = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '' });

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    const data = await db.getSites();
    setSites(data);
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    
    // Ensure data is mapped correctly before sending
    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      address: formData.address.trim()
    };
    
    if (editMode && currentId) {
      success = await db.updateSite(currentId, payload);
      if (success) showToast('Site details updated successfully', 'success');
    } else {
      success = await db.addSite(payload);
      if (success) showToast('New site created successfully', 'success');
    }

    if (success) {
      setIsModalOpen(false);
      resetForm();
      fetchSites();
    } else {
      showToast('Operation failed. Check if Site Code is unique.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const success = await db.deleteSite(deleteId);
      if (success) {
        showToast('Site deactivated successfully.', 'success');
        fetchSites();
      } else {
        showToast('Failed to deactivate site.', 'error');
      }
      setDeleteId(null);
    }
  };

  const openEditModal = (site: Site) => {
    // Map existing site data to form fields
    setFormData({ 
      name: site.name || '', 
      code: site.code || '', 
      address: site.address || '' 
    });
    setCurrentId(site.id);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '' });
    setEditMode(false);
    setCurrentId(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Site Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor operational locations and workforce distribution.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"
        >
          <Plus size={18} />
          <span>Add New Site</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200 relative">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-brand-blue dark:text-blue-400">
                    <Building size={24} />
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded uppercase tracking-wider">{site.code}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 truncate" title={site.name}>{site.name}</h3>
                <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4 h-10 overflow-hidden">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <p className="line-clamp-2" title={site.address}>{site.address}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <Users size={16} className="text-brand-yellow" />
                      <span>{site.employeeCount || 0} Employees</span>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(site)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Edit Site Details"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(site.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Deactivate Site"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Site Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold dark:text-white">{editMode ? 'Edit Site Details' : 'Create New Site'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" placeholder="e.g. Headquarters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site Code</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded uppercase focus:ring-2 focus:ring-brand-blue" placeholder="e.g. DEL-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" rows={3} placeholder="Full address including pin code"></textarea>
              </div>
              <button type="submit" className="w-full bg-brand-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors">
                {editMode ? 'Update Site' : 'Create Site'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Deactivate Site?</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Are you sure you want to deactivate this site? It will be hidden from the roster but data is preserved.
                 </p>
                 <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setDeleteId(null)}
                      className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                      Yes, Deactivate
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};