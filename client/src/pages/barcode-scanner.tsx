import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  FileText,
  Barcode,
  NotebookPen,
  Check,
  AlertTriangle,
  Trash2,
  LogOut,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MobileCameraScanner from "@/components/mobile-camera-scanner";
import ScannedBarcodesList from "@/components/scanned-barcodes-list";
import type { ScanSession } from "@shared/schema";

interface ScannedBarcode {
  value: string;
  timestamp: string;
}

export default function BarcodeScanner() {
  const { logout } = useAuth();
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [scannedBarcodes, setScannedBarcodes] = useState<ScannedBarcode[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create scan session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: {
      deliveryNoteNumber: string;
      barcodes: string[];
    }) => {
      const response = await apiRequest("POST", "/api/scan-sessions", data);
      return response.json();
    },
    onSuccess: (session: ScanSession) => {
      setCurrentSessionId(session.id);
    },
  });

  // Update scan session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({
      id,
      barcodes,
    }: {
      id: number;
      barcodes: string[];
    }) => {
      const response = await apiRequest("PATCH", `/api/scan-sessions/${id}`, {
        barcodes,
      });
      return response.json();
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/scan-sessions/${sessionId}/send-email`
      );
      return response.json();
    },
    onSuccess: () => {
      setShowSuccessModal(true);
      // Clear the current session's barcodes immediately
      if (currentSessionId) {
        updateSessionMutation.mutate({ id: currentSessionId, barcodes: [] });
      }
      // Reset form after successful send
      setTimeout(() => {
        setDeliveryNoteNumber("");
        setScannedBarcodes([]);
        setCurrentSessionId(null);
        setShowSuccessModal(false);
      }, 3000);
    },
    onError: (error: any) => {
      setErrorMessage(
        error.message ||
          "Det gick inte att skicka e-posten. Kontrollera internetanslutningen och försök igen.",
      );
      setShowErrorModal(true);
    },
  });

  const handleBarcodeScanned = async (barcode: string) => {
    // Check for duplicates
    if (scannedBarcodes.some((b) => b.value === barcode)) {
      toast({
        title: "Dublett upptäckt",
        description: "Denna streckkod har redan skannats",
        variant: "destructive",
      });
      return;
    }

    const newBarcode: ScannedBarcode = {
      value: barcode,
      timestamp: new Date().toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedBarcodes = [...scannedBarcodes, newBarcode];
    setScannedBarcodes(updatedBarcodes);

    // Create or update session
    const barcodeValues = updatedBarcodes.map((b) => b.value);

    if (currentSessionId) {
      updateSessionMutation.mutate({
        id: currentSessionId,
        barcodes: barcodeValues,
      });
    } else if (deliveryNoteNumber.trim()) {
      createSessionMutation.mutate({
        deliveryNoteNumber: deliveryNoteNumber.trim(),
        barcodes: barcodeValues,
      });
    }

    toast({
      title: "Streckkod skannad",
      description: `${barcode} har lagts till`,
    });
  };

  const handleRemoveBarcode = (index: number) => {
    const updatedBarcodes = scannedBarcodes.filter((_, i) => i !== index);
    setScannedBarcodes(updatedBarcodes);

    if (currentSessionId) {
      const barcodeValues = updatedBarcodes.map((b) => b.value);
      updateSessionMutation.mutate({
        id: currentSessionId,
        barcodes: barcodeValues,
      });
    }
  };

  const handleClearAll = () => {
    setScannedBarcodes([]);
    if (currentSessionId) {
      updateSessionMutation.mutate({ id: currentSessionId, barcodes: [] });
    }
  };

  const handleSendEmail = async () => {
    if (!deliveryNoteNumber.trim()) {
      toast({
        title: "Följesedelnummer saknas",
        description: "Ange följesedelnummer innan du skickar rapporten",
        variant: "destructive",
      });
      return;
    }

    if (scannedBarcodes.length === 0) {
      toast({
        title: "Inga streckkoder",
        description: "Skanna minst en streckkod innan du skickar rapporten",
        variant: "destructive",
      });
      return;
    }

    if (currentSessionId) {
      sendEmailMutation.mutate(currentSessionId);
    } else {
      // Create session first, then send
      const barcodeValues = scannedBarcodes.map((b) => b.value);
      const session = await createSessionMutation.mutateAsync({
        deliveryNoteNumber: deliveryNoteNumber.trim(),
        barcodes: barcodeValues,
      });
      sendEmailMutation.mutate(session.id);
    }
  };

  const handleDeliveryNoteChange = (value: string) => {
    setDeliveryNoteNumber(value);

    // Create new session if we have barcodes but no session yet
    if (value.trim() && scannedBarcodes.length > 0 && !currentSessionId) {
      const barcodeValues = scannedBarcodes.map((b) => b.value);
      createSessionMutation.mutate({
        deliveryNoteNumber: value.trim(),
        barcodes: barcodeValues,
      });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Barcode className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                Streckkodsskanner
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-primary">
                  {scannedBarcodes.length} skannade
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Delivery Note Input */}
        <Card className="p-4">
          <Label
            htmlFor="delivery-note"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Följesedelnummer
          </Label>
          <div className="relative">
            <Input
              id="delivery-note"
              type="text"
              placeholder="Ange följesedelnummer"
              value={deliveryNoteNumber}
              onChange={(e) => handleDeliveryNoteChange(e.target.value)}
              className="pl-4 pr-12"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </Card>

        {/* Camera Scanner */}
        <MobileCameraScanner onBarcodeScanned={handleBarcodeScanned} />

        {/* Scanned Barcodes List */}
        <ScannedBarcodesList
          barcodes={scannedBarcodes}
          onRemoveBarcode={handleRemoveBarcode}
          onClearAll={handleClearAll}
        />

        {/* Send Button */}
        <Card className="p-4">
          <Button
            onClick={handleSendEmail}
            disabled={
              !deliveryNoteNumber.trim() ||
              scannedBarcodes.length === 0 ||
              sendEmailMutation.isPending
            }
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold h-auto"
            size="lg"
          >
            {sendEmailMutation.isPending ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Skickar e-post...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <NotebookPen className="h-5 w-5" />
                <span>Skicka rapport via e-post</span>
              </div>
            )}
          </Button>

          <p className="text-sm text-gray-500 text-center mt-3">
            Rapporten skickas till konfigurerad e-postadress
          </p>
        </Card>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm mx-auto text-center">
          <DialogTitle className="sr-only">E-post skickad</DialogTitle>
          <DialogDescription className="sr-only">
            Rapporten med streckkoder har skickats via e-post
          </DialogDescription>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            E-post skickad!
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            Rapporten med {scannedBarcodes.length} streckkoder har skickats!
          </p>
          <Button onClick={() => setShowSuccessModal(false)} className="w-full">
            Fortsätt
          </Button>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-sm mx-auto text-center">
          <DialogTitle className="sr-only">Fel uppstod</DialogTitle>
          <DialogDescription className="sr-only">
            Ett fel uppstod när rapporten skulle skickas via e-post
          </DialogDescription>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Fel uppstod
          </h3>
          <p className="text-gray-600 text-sm mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setShowErrorModal(false);
                if (currentSessionId) {
                  sendEmailMutation.mutate(currentSessionId);
                }
              }}
              className="w-full"
            >
              Försök igen
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowErrorModal(false)}
              className="w-full"
            >
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
