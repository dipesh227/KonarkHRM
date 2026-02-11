import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { dbService } from '../../services/mockDb';
import { JobRole } from '../../types';
import { Briefcase, Plus, Trash2, Shield, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function JobRoleManagement() {
   const { showToast } = useToast();
   const [roles, setRoles] = useState<JobRole[]>([]);
   const [loading, setLoading] = useState(true);
   const [newRoleTitle, setNewRoleTitle] = useState('');
   const [newRoleDesc, setNewRoleDesc] = useState('');
   const [isAdding, setIsAdding] = useState(false);

   useEffect(() => {
      loadRoles();
   }, []);

   const loadRoles = async () => {
      try {
         const data = await dbService.getJobRoles();
         setRoles(data);
      } catch (e) {
         console.error(e);
         showToast("Failed to load job roles.", "error");
      } finally {
         setLoading(false);
      }
   };

   const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRoleTitle.trim()) return;

      setIsAdding(true);
      try {
         await dbService.addJobRole(newRoleTitle.trim(), newRoleDesc.trim());
         showToast("Job role added successfully.", "success");
         setNewRoleTitle('');
         setNewRoleDesc('');
         loadRoles();
      } catch (e: any) {
         showToast(e.message || "Failed to add role.", "error");
      } finally {
         setIsAdding(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this job role?")) return;
      try {
         await dbService.deleteJobRole(id);
         showToast("Job role deleted.", "success");
         loadRoles();
      } catch (e: any) {
         showToast(e.message, "error");
      }
   };

   return (
      <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
         <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Role Management</h1>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Role Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Role</h2>
               <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase pl-1">
                        Role Title
                     </label>
                     <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                           type="text"
                           value={newRoleTitle}
                           onChange={e => setNewRoleTitle(e.target.value)}
                           placeholder="e.g. Mason"
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           required
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase pl-1">
                        Description (Optional)
                     </label>
                     <textarea
                        value={newRoleDesc}
                        onChange={e => setNewRoleDesc(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                        placeholder="Brief description of responsibilities..."
                     />
                  </div>

                  <Button type="submit" variant="primary" fullWidth icon={Plus} isLoading={isAdding}>
                     Create Role
                  </Button>
               </form>
            </div>

            {/* Role List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Existing Roles ({roles.length})
               </h2>

               {loading ? (
                  <div className="py-12 flex justify-center">
                     <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
                  </div>
               ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                     {roles.map(role => (
                        <div
                           key={role.id}
                           className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center group hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                        >
                           <div>
                              <div className="flex items-center gap-2">
                                 <h4 className="font-bold text-slate-800 dark:text-white">{role.title}</h4>
                                 {role.isSystemDefault && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1" title="System Default - Cannot Delete">
                                       <Shield className="w-3 h-3" /> System
                                    </span>
                                 )}
                              </div>
                              {role.description && (
                                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{role.description}</p>
                              )}
                           </div>
                           {!role.isSystemDefault && (
                              <button
                                 onClick={() => handleDelete(role.id)}
                                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                 title="Delete Role"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                     ))}
                     {roles.length === 0 && (
                        <p className="text-center py-8 text-slate-400">No roles defined yet.</p>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
