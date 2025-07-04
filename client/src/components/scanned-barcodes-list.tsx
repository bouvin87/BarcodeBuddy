import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Barcode, Trash2, X, Package, Hash, Scale } from "lucide-react";
import { parseQRCode, formatWeight } from "@shared/qr-parser";

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
        // Table view
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Artikel</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Vikt</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barcodes.map((barcode, index) => {
                const parsed = parseQRCode(barcode.value);
                const isQRCode = parsed !== null;
                
                return (
                  <TableRow key={`${barcode.value}-${index}`}>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center space-x-1">
                        <span>{index + 1}</span>
                        {isQRCode ? (
                          <Package className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Barcode className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    
                    {isQRCode ? (
                      <>
                        <TableCell>
                          <div className="font-medium text-sm">{parsed.orderNumber}</div>
                          <div className="text-xs text-gray-500">{barcode.timestamp}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[120px] truncate" title={parsed.articleNumber}>
                            {parsed.articleNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {parsed.batchNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end text-sm font-medium text-purple-600">
                            <Scale className="h-3 w-3 mr-1" />
                            {formatWeight(parsed.weight)}
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div className="text-sm text-gray-500">-</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{barcode.value}</div>
                          <div className="text-xs text-gray-500">{barcode.timestamp}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            Streckkod
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs text-gray-400">-</div>
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBarcode(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
