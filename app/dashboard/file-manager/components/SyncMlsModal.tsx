import { useAppContext } from '@/app/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2, AlertCircle, Package, Info, GripVertical, ArrowLeftRight } from 'lucide-react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useFileManagerContext, Files } from '../FileManagerContext';
import { useGlobalFileUpload } from '@/context/GlobalFileUploadContext';
import { computeGlobalReorderUpdates } from '../utils/sortOrderUtils';
import { ApiFile } from './DownloadModal';
import { Order } from '../../orders/page';
import { Input } from '@/components/ui/input';
import { SyncToMls } from '../../orders/orders';
import { EditListings } from '../../listings/listing';
import { toast } from 'sonner';
import { SortableGrid } from './dual-mode/SortableGrid';
import { FileItem } from './dual-mode/types';

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

  // FileItems for SortableGrid
  const [photoItems, setPhotoItems] = useState<FileItem[]>([]);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const { filesData, setFilesData, deletedSnapshotUuids, links, delay, transition, selectedAudioTrack } = useFileManagerContext();
  const { startUpload } = useGlobalFileUpload();
  const [isGlobalSaving, setGlobalSaving] = useState(false);

  // Mobile layout state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mlsInputRef = React.useRef<HTMLInputElement>(null);
  const [showMlsError, setShowMlsError] = useState(false);

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

  const validApiFiles = useMemo(() => {
    return apiFiles.filter(f => f.variant_urls && Object.keys(f.variant_urls).length > 0);
  }, [apiFiles]);

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

      // Initialize fileItems
      const photoApiFiles = validApiFiles.filter(f => f.type === 'photo');

      const sortedPhotos = [...photoApiFiles].sort((a, b) => {
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.service?.id ?? 0) - (b.service?.id ?? 0);
      });

      setPhotoItems(
        sortedPhotos.map((f, index) => ({
          clientId: f.uuid,
          url: f.url || '',
          status: 'uploaded',
          order: index,
          originalData: f,
        }))
      );
    }
  }, [open, orderData, performValidation, validApiFiles]);

  const handleMlsChange = (val: string) => {
    setMlsNumber(val);
    setShowMlsError(false);
    performValidation(val);
    if (val.trim() === '' || !/^[A-Z0-9]{7,12}$/i.test(val.trim())) {
      setSelectedFiles([]);
    }
  };

  const isMlsValid = mlsStatus === 'valid';
  const totalFilesCount = validApiFiles.length;

  const handleSelectAllGlobal = (checked: boolean) => {
    if (!mlsNumber.trim() || !isMlsValid) {
      setShowMlsError(true);
      mlsInputRef.current?.focus();
      mlsInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (checked) {
      setSelectedFiles(validApiFiles.map((f) => f.uuid));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleToggleFile = useCallback((fileId: string) => {
    if (!mlsNumber.trim() || !isMlsValid) {
      setShowMlsError(true);
      mlsInputRef.current?.focus();
      mlsInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  }, [isMlsValid, mlsNumber]);

  const handlePhotoOrderChange = useCallback((newItems: FileItem[]) => {
    setPhotoItems(newItems);
  }, []);

  const handleSaveReorder = useCallback(async () => {
    if (!filesData) return;

    // Compute globally-unique sort_orders for photos
    const reorderedPhotos = photoItems
      .map((item) => item.originalData as Files)
      .filter(Boolean);
    const photoUpdates = computeGlobalReorderUpdates(reorderedPhotos);

    const allUpdates = [...photoUpdates];
    const updatesMap = new Map(allUpdates.map((u) => [u.uuid, u.sort_order]));

    const newlyChangedFiles: Files[] = [];
    const newFilesList = filesData.files.map((f) => {
      const newOrder = updatesMap.get(f.uuid);
      if (newOrder !== undefined && f.sort_order !== newOrder) {
        const updatedFile = { ...f, sort_order: newOrder };
        newlyChangedFiles.push(updatedFile);
        return updatedFile;
      }
      return f;
    });

    if (newlyChangedFiles.length === 0) {
      setIsReorderMode(false);
      return;
    }

    // Write new sort_orders into context immediately for UI update
    setFilesData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: newFilesList,
      };
    });

    const token = localStorage.getItem("token");
    if (!token || !orderData) {
      toast.error("Could not save image order. Missing data.");
      return;
    }

    const activeSnapshots = (filesData.snapshots || [])
      .filter((s) => !deletedSnapshotUuids.has(s.uuid))
      .map((snap) => ({
        uuid: snap.uuid,
        x: Number(snap.x_axis ?? 0),
        y: Number(snap.y_axis ?? 0),
        floorImageUrl: snap.file_name ?? "",
        isApi: true as const,
        name: snap.name ?? undefined,
        description: snap.description ?? undefined,
        file_path: snap.file_path,
        url: snap.url,
        thumbnail_url: snap.thumbnail_url,
        variant_urls: snap.variant_urls,
      }));

    setGlobalSaving(true);
    try {
      await startUpload({
        token,
        orderUuid: orderData.uuid,
        filesDataUuid: filesData.uuid,
        files: [],
        links: links,
        droppedMarkers: activeSnapshots,
        delay: delay,
        transition: transition,
        selectedAudioTrack: selectedAudioTrack || "none",
        changedFiles: newlyChangedFiles,
        isUpdate: true,
        successMessage: "Images sorted successfully."
      });
      setIsReorderMode(false);
    } catch (error) {
      console.error("Failed to save image order", error);
      toast.error("Failed to save image order.");
    } finally {
      setGlobalSaving(false);
    }
  }, [photoItems, filesData, setFilesData, startUpload, orderData, delay, transition, selectedAudioTrack, deletedSnapshotUuids, links]);

  const handleCancelReorder = useCallback(() => {
    const photoApiFiles = validApiFiles.filter(f => f.type === 'photo');

    const sortedPhotos = [...photoApiFiles].sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (a.service?.id ?? 0) - (b.service?.id ?? 0);
    });

    setPhotoItems(
      sortedPhotos.map((f, index) => ({
        clientId: f.uuid,
        url: f.url || '',
        status: 'uploaded',
        order: index,
        originalData: f,
      }))
    );
    setIsReorderMode(false);
  }, [validApiFiles]);

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
            agent_id: orderData?.agent?.uuid,
            address: orderData?.property?.address,
            city: orderData?.property?.city,
            province: orderData?.property?.province,
            country: orderData?.property?.country,
            mls_number: mlsNumber.trim(),
            mls_property: orderData?.property?.mls_property || null
          });
        }
        setIsUpdatingMls(false);
      }

      // 2. Trigger Sync
      // Preserve the order defined in the UI
      const allFileItems = [...photoItems];
      const fileIds = allFileItems
        .filter(item => selectedFiles.includes(item.clientId))
        .map(item => (item.originalData as ApiFile).id);

      // We also might want to pass sorted selected files array back for onSync
      const sortedSelectedUuids = allFileItems
        .filter(item => selectedFiles.includes(item.clientId))
        .map(item => item.clientId);

      if (onSync) {
        await onSync(sortedSelectedUuids, mlsNumber.trim());
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

  const renderPhotoCard = useCallback(
    (item: FileItem) => {
      const file = item.originalData as ApiFile;
      if (!file) return null;

      const imgSrc = file.thumbnail_url || file.variant_urls?.thumb || file.url || '';
      const isSelected = selectedFiles.includes(item.clientId);

      return (
        <div
          className={`relative bg-white rounded-lg overflow-hidden group select-none border-2 transition-all ${isReorderMode ? 'cursor-grab active:cursor-grabbing hover:border-[#BBBBBB]' : `cursor-pointer ${isSelected ? `${userType}-border shadow-md` : 'border-[#E4E4E4] hover:border-[#BBBBBB]'}`}`}
          onClick={() => { if (!isReorderMode) handleToggleFile(item.clientId); }}
        >
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-black">
            {file.is_processing ? (
              <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                <p className="text-gray-500 font-medium text-sm">Processing…</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgSrc}
                alt={file.name}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            )}

            {isSelected && (
              <div className={`absolute top-2 right-2 z-10 ${userType}-text bg-white rounded-full shadow-sm`}>
                <CheckCircle2 className="w-6 h-6 shadow-sm" />
              </div>
            )}

            {isReorderMode && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <GripVertical className="text-white w-8 h-8 drop-shadow-lg" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
              <p className="text-white text-[13px] truncate font-medium">{file.group?.trim() ? file.group : file.name}</p>
              <p className="text-gray-300 text-[10px] truncate">{file.service?.name}</p>
            </div>
          </div>

          <div className={`items-center justify-between px-2 py-2 bg-white text-[13px] border-t border-[#E4E4E4] ${isReorderMode ? 'hidden md:flex' : 'flex'}`}>
            <p className="text-[#424242] font-semibold truncate max-w-[80%] text-[10px] md:text-[13px]">
              {file.group?.trim() ? file.group : file.name}
            </p>
            <span className="text-[#999] text-[8px] md:text-[10px] uppercase ml-1 shrink-0">
              {file.type}
            </span>
          </div>
        </div>
      );
    },
    [selectedFiles, userType, handleToggleFile, isReorderMode]
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#FAFAFA] rounded-[8px] shadow-lg border p-6 w-full max-w-[950px] max-h-[calc(100vh-40px)] flex flex-col font-alexandria [&>button]:hidden overflow-hidden !transform-none !top-0 !bottom-0 !left-0 !right-0 m-auto h-fit">
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

        <div className="flex-1 overflow-y-auto pr-2 sidebar-scroll mt-4 flex flex-col">
          {/* MLS Number Field */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E4E4E4] mb-4 order-2 md:order-1">
            <p className={`text-[14px] font-semibold ${userType}-text mb-2 uppercase tracking-wider`}>
              MLS Number {isMlsMissing && <span className="text-red-500">*</span>}
            </p>
            <div className="relative">
              <Input
                ref={mlsInputRef}
                value={mlsNumber}
                onChange={(e) => handleMlsChange(e.target.value)}
                placeholder="e.g. X1234567"
                className={`h-[44px] pr-10 ${(mlsStatus === 'valid' && !showMlsError) ? 'border-green-500' : (mlsStatus === 'invalid' || showMlsError) ? 'border-red-400 focus-visible:ring-red-400' : 'border-[#BBBBBB]'
                  }`}
                disabled={isSyncing || isExistingMls}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {mlsStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {mlsStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {mlsStatus === 'invalid' && !showMlsError && (
              <p className="text-red-500 text-[12px] mt-1 italic flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Invalid MLS format. Use Letter+7-8 digits (CA) or 7-10 digits (US).
              </p>
            )}
            {showMlsError && (
              <p className="text-red-500 text-[13px] mt-2 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Please enter an MLS Number before selecting media for sync.
              </p>
            )}
            {isMlsMissing && mlsStatus === 'idle' && !showMlsError && (
              <p className={`${userType}-text opacity-70 text-[12px] mt-1 italic flex items-center gap-1`}>
                <Info className="w-3 h-3 shrink-0" />
                Enter your mls number to sync to mls.
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="mb-4 p-4 rounded-lg flex gap-3 items-start border border-blue-200 bg-blue-50/50 order-1 md:order-2">
            <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
            <div className="text-[13px] text-blue-900/80 leading-relaxed">
              <p className="font-semibold text-blue-900 mb-1 text-[14px]">MLS Photo Order Information</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Photos will be published to the MLS in the order shown below.</li>
                <li>The first image will be used as the listing&apos;s primary photo, where supported by the MLS.</li>
                <li>Rearrange photos to control how they are presented to agents and buyers.</li>
                <li>Save your changes before syncing to ensure the correct photo sequence is transmitted.</li>
              </ul>
            </div>
          </div>

          {totalFilesCount > 0 ? (
            <div className="order-3">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-x-2.5">
                  <div
                    onClick={() => {
                      if (!isReorderMode) {
                        handleSelectAllGlobal(!(selectedFiles.length === totalFilesCount && totalFilesCount > 0))
                      }
                    }}
                    className={`w-4 h-4 flex items-center justify-center rounded-[2px] cursor-pointer bg-white border border-[#666666] transition-all ${(!isMlsValid || isReorderMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {selectedFiles.length === totalFilesCount && totalFilesCount > 0 && (
                      <div className={`${userType}-bg w-2.5 h-2.5 rounded-[1px]`} />
                    )}
                  </div>
                  <label className={`text-[#666666] text-sm font-medium uppercase tracking-tight ${(!isMlsValid || isReorderMode) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    Select All ({selectedFiles.length}/{totalFilesCount})
                  </label>
                </div>
                {isReorderMode ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px] border-[#BBBBBB] text-[#666666]"
                      onClick={handleCancelReorder}
                      disabled={isGlobalSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-[12px] bg-[#4290E9] hover:bg-[#4999f5] text-white"
                      onClick={handleSaveReorder}
                      disabled={isGlobalSaving}
                    >
                      {isGlobalSaving ? "Saving..." : "Done"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex md:flex h-8 text-[12px] gap-1.5 font-medium border border-[#BBBBBB] text-[#666666] hover:border-[#4290E9] hover:text-[#4290E9]"
                    onClick={() => setIsReorderMode(true)}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Sort Images
                  </Button>
                )}
              </div>

              {photoItems.length > 0 && (
                <div className="mb-6">
                  <p className={`text-[15px] font-semibold ${userType}-text mb-3 uppercase tracking-wider`}>
                    Photos ({photoItems.length})
                  </p>
                  <SortableGrid
                    items={photoItems}
                    onOrderChange={handlePhotoOrderChange}
                    mode={isReorderMode ? "reorder" : "upload"}
                    renderItem={renderPhotoCard}
                    columns={isMobile ? 2 : 4}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-[#E4E4E4] flex flex-col items-center justify-center text-center order-3">
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

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-3 font-alexandria border-t border-[#E4E4E4] pt-1">
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
            disabled={!isMlsValid || selectedFiles.length === 0 || isSyncing || isReorderMode}
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
      </DialogContent >
    </Dialog >
  );
};

export default SyncMlsModal;

