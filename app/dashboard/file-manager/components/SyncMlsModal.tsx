import { useAppContext } from '@/app/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2, AlertCircle, Package, Info } from 'lucide-react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ApiFile } from './DownloadModal';
import { Order } from '../../orders/page';
import { Input } from '@/components/ui/input';
import { SyncToMls } from '../../orders/orders';
import { EditListings } from '../../listings/listing';
import { toast } from 'sonner';

type ValidationStatus = 'idle' | 'valid' | 'invalid';

type Props = {
  open: boolean;
  onClose: () => void;
  apiFiles: ApiFile[];
  orderData: Order | null;
  tourUuid?: string;
  onSync?: (selectedFiles: string[], mlsNumber: string) => Promise<void>;
};

const SyncMlsModal: React.FC<Props> = ({ open, onClose, apiFiles, orderData, tourUuid, onSync }) => {
  const { userType } = useAppContext();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Fields state
  const [mlsNumber, setMlsNumber] = useState<string>('');
  
  // Internal actions state
  const [isUpdatingMls, setIsUpdatingMls] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExistingMls, setIsExistingMls] = useState(false);

  // Validation state
  const [mlsStatus, setMlsStatus] = useState<ValidationStatus>('idle');

  const performValidation = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setMlsStatus('idle');
      return;
    }

    // Canada/USA MLS: Letter+7-8 digits OR 7-10 digits (Total 7-12 chars)
    const isValid = /^[A-Z0-9]{7,12}$/i.test(trimmed);
    setMlsStatus(isValid ? 'valid' : 'invalid');
  }, []);

  // Initialization
  useEffect(() => {
    if (open && orderData) {
      const initialMls = orderData.property?.mls_number || orderData.property?.mls_property || '';
      setMlsNumber(initialMls);
      setIsExistingMls(!!initialMls);
      
      // Auto-validate if pre-filled
      if (initialMls) performValidation(initialMls);
      else setMlsStatus('idle');
      
      setSelectedFiles([]);
    }
  }, [open, orderData, performValidation]);

  const handleMlsChange = (val: string) => {
    setMlsNumber(val);
    performValidation(val);
    if (val.trim() === '' || !/^[A-Z0-9]{7,12}$/i.test(val.trim())) {
      setSelectedFiles([]);
    }
  };

  const isMlsValid = mlsStatus === 'valid';

  // Group files by service
  const groupedFiles = useMemo(() => {
    const groups: Map<string, ApiFile[]> = new Map();
    
    apiFiles.forEach((file) => {
      const serviceName = file.service?.name || "Other Media";
      if (!groups.has(serviceName)) {
        groups.set(serviceName, []);
      }
      groups.get(serviceName)?.push(file);
    });

    return Array.from(groups.entries()).map(([name, files]) => ({
      name,
      files: files.map(f => ({
        id: f.uuid,
        name: f.group || f.name,
        url: f.url || '',
        type: f.type,
        uuid: f.uuid,
        thumbnail_url: f.thumbnail_url,
        variant_urls: f.variant_urls,
      }))
    }));
  }, [apiFiles]);

  const totalFilesCount = apiFiles.length;

  const handleSelectAllGlobal = (checked: boolean) => {
    if (!isMlsValid) return;
    if (checked) {
      setSelectedFiles(apiFiles.map((f) => f.uuid));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSelectService = (serviceFiles: {id: string}[], checked: boolean) => {
    if (!isMlsValid) return;
    const serviceIds = serviceFiles.map(f => f.id);
    if (checked) {
      setSelectedFiles(prev => Array.from(new Set([...prev, ...serviceIds])));
    } else {
      setSelectedFiles(prev => prev.filter(id => !serviceIds.includes(id)));
    }
  };

  const handleToggleFile = (fileId: string) => {
    if (!isMlsValid) return;
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSync = async () => {
    if (!isMlsValid || selectedFiles.length === 0) return;

    setIsSyncing(true);
    try {
      const token = localStorage.getItem('token') || '';

      // 1. Update MLS number to property if not already exists
      if (!isExistingMls && mlsNumber.trim()) {
        setIsUpdatingMls(true);
        const propertyUuid = orderData?.property?.uuid;
        if (propertyUuid) {
          await EditListings(propertyUuid, {
            mls_number: mlsNumber.trim(),
            mls_property: `MLS#: ${mlsNumber.trim()}`
          });
        }
        setIsUpdatingMls(false);
      }

      // 2. Trigger Sync
      const fileIds = apiFiles
        .filter(f => selectedFiles.includes(f.uuid))
        .map(f => f.id);

      if (onSync) {
        await onSync(selectedFiles, mlsNumber.trim());
      } else {
        await SyncToMls(tourUuid || orderData?.uuid || '', {
          file_ids: fileIds
        }, token);
        toast.success(`Successfully synced ${selectedFiles.length} files for MLS #${mlsNumber.trim()}`);
      }

      onClose();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync to MLS. Please check your data and try again.');
    } finally {
      setIsSyncing(false);
      setIsUpdatingMls(false);
    }
  };

  const isMlsMissing = !orderData?.property?.mls_number && !orderData?.property?.mls_property;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#FAFAFA] rounded-[8px] shadow-lg border p-6 w-full max-w-[750px] max-h-[calc(100vh-40px)] flex flex-col font-alexandria [&>button]:hidden overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between border-b border-[#E4E4E4] pb-2">
            <DialogTitle className={`uppercase ${userType}-text text-[18px] font-semibold`}>
              Sync to MLS
            </DialogTitle>
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-0 hover:bg-transparent shadow-none h-auto transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#7D7D7D]" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 sidebar-scroll mt-4">
          {/* MLS Number Field */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E4E4E4] mb-4">
            <p className={`text-[14px] font-semibold ${userType}-text mb-2 uppercase tracking-wider`}>
              MLS Number {isMlsMissing && <span className="text-red-500">*</span>}
            </p>
            <div className="relative">
              <Input
                value={mlsNumber}
                onChange={(e) => handleMlsChange(e.target.value)}
                placeholder="e.g. X1234567"
                className={`h-[44px] pr-10 ${
                  mlsStatus === 'valid' ? 'border-green-500' : mlsStatus === 'invalid' ? 'border-red-400' : 'border-[#BBBBBB]'
                }`}
                disabled={isSyncing || isExistingMls}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {mlsStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {mlsStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {mlsStatus === 'invalid' && (
              <p className="text-red-500 text-[12px] mt-1 italic flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Invalid MLS format. Use Letter+7-8 digits (CA) or 7-10 digits (US).
              </p>
            )}
            {isMlsMissing && mlsStatus === 'idle' && (
              <p className={`${userType}-text opacity-70 text-[12px] mt-1 italic flex items-center gap-1`}>
                <Info className="w-3 h-3 shrink-0" />
                Enter your mls number to sync to mls.
              </p>
            )}
          </div>

          {totalFilesCount > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-x-2.5">
                    <div
                    onClick={() => handleSelectAllGlobal(!(selectedFiles.length === totalFilesCount && totalFilesCount > 0))}
                    className={`w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666] transition-all ${!isMlsValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    {selectedFiles.length === totalFilesCount && totalFilesCount > 0 && (
                        <div className={`${userType}-bg w-2.5 h-2.5 rounded-[1px]`} />
                    )}
                    </div>
                    <label className={`text-[#666666] text-sm font-medium uppercase tracking-tight ${!isMlsValid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    Select All ({selectedFiles.length}/{totalFilesCount})
                    </label>
                </div>
              </div>

              <Accordion type="multiple" defaultValue={groupedFiles.map(g => g.name)} className="space-y-4">
                {groupedFiles.map((group) => {
                  const allGroupSelected = group.files.every(f => selectedFiles.includes(f.id));
                  const someGroupSelected = group.files.some(f => selectedFiles.includes(f.id));

                  return (
                    <AccordionItem key={group.name} value={group.name} className="border border-[#E4E4E4] rounded-lg bg-white overflow-hidden shadow-sm">
                      <div className="flex items-center bg-gray-50/80 px-4 border-b border-[#E4E4E4]">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectService(group.files, !allGroupSelected);
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666] transition-all mr-3 ${!isMlsValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {allGroupSelected ? (
                            <div className={`${userType}-bg w-2.5 h-2.5 rounded-[1px]`} />
                          ) : someGroupSelected ? (
                            <div className="bg-gray-400 w-2 h-0.5" />
                          ) : null}
                        </div>
                        <AccordionTrigger className="flex-1 py-4 hover:no-underline font-semibold text-[15px] uppercase text-[#424242]">
                          <div className="flex items-center gap-2">
                             <Package className={`w-4 h-4 ${userType}-text`} />
                             {group.name}
                             <span className="text-[12px] font-normal text-[#999999] ml-2">
                               ({group.files.filter(f => selectedFiles.includes(f.id)).length}/{group.files.length} Selected)
                             </span>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="p-4 pb-2">
                        <div className="grid grid-cols-1 gap-y-3">
                          {group.files.map((file) => (
                            <div
                              key={file.id}
                              className={`flex items-center gap-x-4 p-3 bg-white rounded-lg border border-[#F0F0F0] transition-colors ${!isMlsValid ? 'opacity-50' : 'hover:border-[#BBBBBB]'}`}
                            >
                              <div
                                onClick={() => handleToggleFile(file.id)}
                                className={`w-5 h-5 flex items-center justify-center rounded-[4px] bg-white border border-[#BBBBBB] shrink-0 ${!isMlsValid ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {selectedFiles.includes(file.id) && (
                                  <div className={`${userType}-bg w-3 h-3 rounded-[2px]`} />
                                )}
                              </div>

                              <div className="relative w-[100px] h-[65px] shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-inner">
                                {file.type === 'photo' ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={file.thumbnail_url || file.variant_urls?.thumb || file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : file.type === 'video' ? (
                                  <div className="relative w-full h-full">
                                    <video src={file.url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                       <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                                       </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-xs">
                                    {file.name.split('.').pop() || 'FILE'}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-y-1 flex-grow min-w-0">
                                <p className="text-[#424242] text-[15px] font-semibold truncate leading-tight">{file.name}</p>
                                <p className="text-[#999999] text-[11px] uppercase font-medium">{file.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-[#E4E4E4] flex flex-col items-center justify-center text-center">
               <Package className="w-12 h-12 text-gray-300 mb-4" />
               <p className={`${userType}-text font-semibold text-[16px] mb-1`}>
                 No media available for sync.
               </p>
               <p className="text-gray-500 text-[14px]">
                 You have not approved any media or service not paid yet.
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-3 font-alexandria border-t border-[#E4E4E4] pt-4 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSyncing}
            className={`bg-white rounded-[6px] w-full md:w-[170px] h-[44px] text-[16px] font-semibold border ${userType}-border ${userType}-text hover:!text-white hover-${userType}-bg transition-colors`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={!isMlsValid || selectedFiles.length === 0 || isSyncing}
            className={`${userType}-bg rounded-[6px] text-white hover:opacity-80 hover:${userType}-bg w-full md:w-[200px] h-[44px] font-semibold text-[16px] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md`}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUpdatingMls ? 'Updating MLS...' : 'Syncing...'}
              </>
            ) : (
              `Sync ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} to MLS`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SyncMlsModal;
