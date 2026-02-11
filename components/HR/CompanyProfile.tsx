import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Company } from '../../types';
import { Upload, Save, Building, FileImage, Stamp, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCompany } from '../../context/CompanyContext';

const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
      <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
    </div>
    
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
       <div className="h-6 w-40 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded"></div>
            <div className="h-10 w-full bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded"></div>
            <div className="h-10 w-full bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800"></div>
          </div>
       </div>
    </div>

    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
       <div className="h-6 w-48 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-40 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800"></div>
          <div className="h-40 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800"></div>
       </div>
    </div>
  </div>
);

export const CompanyProfile = () => {
  const [loading, setLoading] = useState(false);
  const [processingImg, setProcessingImg] = useState(false);
  const [localCompany, setLocalCompany] = useState<Company | null>(null);
  const { showToast } = useToast();
  const { refreshCompany, loading: contextLoading } = useCompany(); 
  
  useEffect(() => {
    // Unit fetching strategy: Load local data first for speed, then sync
    const fetchCompany = async () => {
      const data = await db.getCompanyProfile();
      if (data) setLocalCompany(data);
    };
    fetchCompany();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!localCompany) return;
    setLocalCompany({ ...localCompany, [e.target.name]: e.target.value });
  };

  // --- Image Compression Engine ---
  const processImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG/PNG (0.7 quality is good balance)
          resolve(canvas.toDataURL('image/png', quality)); 
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Company) => {
    const file = e.target.files?.[0];
    if (file && localCompany) {
      setProcessingImg(true);
      try {
        let maxWidth = 300; // Default for Logo/Stamp
        if (field === 'faviconUrl') maxWidth = 64; // Smaller for favicon
        
        const compressedBase64 = await processImage(file, maxWidth, 0.8);
        setLocalCompany({ ...localCompany, [field]: compressedBase64 });
        showToast('Image processed & optimized.', 'info');
      } catch (err) {
        showToast('Failed to process image.', 'error');
      } finally {
        setProcessingImg(false);
      }
    }
  };

  const handleSave = async () => {
    if (!localCompany) return;
    setLoading(true);
    // Directly update the company profile without any client-side encryption
    const success = await db.updateCompanyProfile(localCompany.id, localCompany);
    if (success) {
      await refreshCompany(); // Updates the context and localStorage
      showToast('Company Profile Updated Successfully!', 'success');
    } else {
      showToast('Failed to update profile.', 'error');
    }
    setLoading(false);
  };

  if (!localCompany && contextLoading) return <ProfileSkeleton />;
  if (!localCompany) return <div className="p-8 dark:text-slate-300">Unable to load configuration.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Company Branding</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage assets stored securely in the database.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading || processingImg}
          className={`flex items-center gap-2 bg-brand-blue text-white px-6 py-2 rounded-lg shadow hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors ${loading || processingImg ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Save size={18} />
          {loading ? 'Saving...' : processingImg ? 'Processing...' : 'Save Configuration'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
         <h3 className="flex items-center gap-2 text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b dark:border-slate-700 pb-2">
           <Building size={20} className="text-brand-yellow" /> Organization Details
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input 
                name="name" 
                value={localCompany.name || ''} 
                onChange={handleTextChange} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" 
                placeholder="Enter Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Head Office Address</label>
              <input 
                name="address" 
                value={localCompany.address || ''} 
                onChange={handleTextChange} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:ring-2 focus:ring-brand-blue" 
                placeholder="Enter Address"
              />
            </div>
         </div>
      </div>

      {/* Visual Branding */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
         <h3 className="flex items-center gap-2 text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b dark:border-slate-700 pb-2">
           <FileImage size={20} className="text-brand-yellow" /> Visual Assets (Auto-Compressed)
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Upload */}
            <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center overflow-hidden">
                  {localCompany.logoUrl ? (
                    <img src={localCompany.logoUrl} alt="Logo" loading="lazy" decoding="async" className="object-contain h-full w-full" />
                  ) : (
                    <span className="text-xs text-slate-400">No Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logoUrl')} className="text-sm w-full dark:text-slate-300" />
                  <p className="text-xs text-slate-400 mt-1">Optimized for: 300px width</p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Browser Favicon</label>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center overflow-hidden">
                  {localCompany.faviconUrl ? (
                    <img src={localCompany.faviconUrl} alt="Icon" loading="lazy" decoding="async" className="object-contain h-full w-full" />
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'faviconUrl')} 
                    className="text-sm w-full dark:text-slate-300" 
                  />
                  <p className="text-xs text-slate-400 mt-1">Optimized for: 64px width</p>
                </div>
              </div>
            </div>
         </div>
      </div>

      {/* Official Documents */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
         <h3 className="flex items-center gap-2 text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 border-b dark:border-slate-700 pb-2">
           <Stamp size={20} className="text-brand-yellow" /> Official Documentation
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stamp */}
            <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Company Stamp / Seal</label>
              <div className="mb-3 h-32 bg-white border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center overflow-hidden">
                  {localCompany.stampUrl ? (
                    <img src={localCompany.stampUrl} alt="Stamp" loading="lazy" decoding="async" className="object-contain h-full opacity-80" />
                  ) : (
                    <span className="text-xs text-slate-400">No Stamp Uploaded</span>
                  )}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'stampUrl')} className="text-sm w-full dark:text-slate-300" />
            </div>

            {/* Signature */}
            <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Authorized Signature</label>
               <div className="mb-3 h-32 bg-white border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center overflow-hidden">
                  {localCompany.signatureUrl ? (
                    <img src={localCompany.signatureUrl} alt="Sign" loading="lazy" decoding="async" className="object-contain h-full" />
                  ) : (
                    <span className="text-xs text-slate-400">No Signature Uploaded</span>
                  )}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signatureUrl')} className="text-sm w-full dark:text-slate-300" />
            </div>
         </div>
      </div>
    </div>
  );
};