import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { GradientButton } from "./GradientButton";
import getCroppedImg from "@/lib/cropImage";

interface CropModalProps {
  imageSrc: string | null;
  onClose: () => void;
  onCropSubmit: (croppedFile: File) => void;
}

export function CropModal({ imageSrc, onClose, onCropSubmit }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) {
        onCropSubmit(croppedFile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-card p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b border-border/50">
          <DialogTitle>Crop Profile Photo</DialogTitle>
          <DialogDescription>
            Adjust the image to fit perfectly inside the circle.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-[300px] bg-background/50">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>
        
        <div className="p-4 bg-card border-t border-border/50">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs font-bold text-muted-foreground">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold border border-border rounded-xl active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <GradientButton onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Save Photo"}
            </GradientButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
