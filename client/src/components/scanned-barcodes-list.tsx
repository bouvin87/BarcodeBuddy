import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Barcode, Trash2, X } from "lucide-react";

interface ScannedBarcode {
  value: string;
  timestamp: string;
}

interface ScannedBarcodesListProps {
  barcodes: ScannedBarcode[];
  onRemoveBarcode: (index: number) => void;
  onClearAll: () => void;
}

export default function ScannedBarcodesList({ 
  barcodes, 
  onRemoveBarcode, 
  onClearAll 
}: ScannedBarcodesListProps) {
  return (
    <Card>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Skannade streckkoder</h2>
          {barcodes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Rensa alla
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {barcodes.length === 0 ? (
          // Empty state
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Barcode className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Inga streckkoder skannade än</p>
            <p className="text-gray-400 text-xs mt-1">Använd kameran ovan för att börja skanna</p>
          </div>
        ) : (
          // Barcodes list
          barcodes.map((barcode, index) => (
            <div 
              key={`${barcode.value}-${index}`}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Barcode className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{barcode.value}</p>
                  <p className="text-sm text-gray-500">Skannad {barcode.timestamp}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveBarcode(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
