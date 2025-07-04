import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  parseQRCode,
  calculateTotalWeight,
  formatWeight,
} from "@shared/qr-parser";

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

  const [sentBarcodesCount, setSentBarcodesCount] = useState(0);
  const [sentWeight, setSentWeight] = useState(0);
  
  // Ref to keep track of current barcodes for duplicate checking
  const currentBarcodesRef = useRef<string[]>([]);

  // Calculate total weight from scanned barcodes
  const totalWeight = calculateTotalWeight(scannedBarcodes.map((b) => b.value));
  const qrCodeCount = scannedBarcodes.filter(
    (b) => parseQRCode(b.value) !== null,
  ).length;

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
      // Session created successfully
    },
  });



  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/scan-sessions/${sessionId}/send-email`,
      );
      return response.json();
    },
    onSuccess: () => {
      // Save count and weight before clearing
      setSentBarcodesCount(scannedBarcodes.length);
      setSentWeight(totalWeight);
      setShowSuccessModal(true);
      // Clear state immediately when email is sent
      setScannedBarcodes([]);
      currentBarcodesRef.current = [];
      // Hide success modal after 3 seconds but keep form reset immediate
      setTimeout(() => {
        setShowSuccessModal(false);
        setDeliveryNoteNumber("");
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
    // Check for duplicates using ref for immediate access to current state
    const isDuplicate = currentBarcodesRef.current.includes(barcode);

    if (isDuplicate) {
      toast({
        title: "Dublett upptäckt",
        description: "Denna streckkod/QR-kod har redan skannats",
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
    const barcodeValues = updatedBarcodes.map((b) => b.value);
    
    // Update both state and ref immediately - no backend session yet
    setScannedBarcodes(updatedBarcodes);
    currentBarcodesRef.current = barcodeValues;

    toast({
      title: "Batch skannad",
      description: `${barcode} har lagts till`,
    });
  };

  const handleRemoveBarcode = (index: number) => {
    const updatedBarcodes = scannedBarcodes.filter((_, i) => i !== index);
    const barcodeValues = updatedBarcodes.map((b) => b.value);
    
    setScannedBarcodes(updatedBarcodes);
    currentBarcodesRef.current = barcodeValues;
  };

  const handleClearAll = () => {
    setScannedBarcodes([]);
    currentBarcodesRef.current = [];
    toast({
      title: "Alla poster rensade",
      description: "Alla skannade streckkoder har tagits bort",
    });
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

    // Always create a new session when sending email
    const barcodeValues = scannedBarcodes.map((b) => b.value);
    const session = await createSessionMutation.mutateAsync({
      deliveryNoteNumber: deliveryNoteNumber.trim(),
      barcodes: barcodeValues,
    });
    sendEmailMutation.mutate(session.id);
  };

  const handleDeliveryNoteChange = (value: string) => {
    setDeliveryNoteNumber(value);
    // No session creation here - only when sending email
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200  top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Barcode className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                BarcodeBuddy
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

        {/* Statistics Card */}
        {scannedBarcodes.length > 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {scannedBarcodes.length}
                </div>
                <div className="text-xs text-blue-800 font-medium">TOTAL</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {qrCodeCount}
                </div>
                <div className="text-xs text-green-800 font-medium">
                  QR-KODER
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatWeight(totalWeight)}
                </div>
                <div className="text-xs text-purple-800 font-medium">
                  TOTAL VIKT
                </div>
              </div>
            </div>
          </Card>
        )}

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
                <span>Skicka följesedel via e-post</span>
              </div>
            )}
          </Button>
        </Card>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm mx-auto text-center">
          <DialogTitle className="sr-only">E-post skickad</DialogTitle>
          <DialogDescription className="sr-only">
            Följesedel har skickats via e-post
          </DialogDescription>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            E-post skickad!
          </h3>
          <div className="text-sm mb-6 space-y-2">
            <p className="text-gray-600">
              Följesedeln med <strong>{sentBarcodesCount} poster</strong> har
              skickats!
            </p>
            {sentWeight > 0 && (
              <p className="text-purple-600 font-medium">
                Total vikt: {formatWeight(sentWeight)}
              </p>
            )}
          </div>
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
            Ett fel uppstod när följesedeln skulle skickas via e-post
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
                handleSendEmail();
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
