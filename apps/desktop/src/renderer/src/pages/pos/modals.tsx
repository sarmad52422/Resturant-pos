import type { RestaurantTable } from '@/components/table-card';
import { apiErrorMessage } from '@/lib/api-error';
import type { FormSubmitEvent } from '@/lib/events';
import { CorrectionModal, PaymentModal, PrintReceiptModal, QuickAddConfirmModal } from './components';
import { CustomerSelector } from './customer-selector';
import type { CorrectionTarget, PaymentMethod, PosCustomer, PosMenuItem, PrinterInfo, PrintMode } from './interfaces';
import { TableSelectionModal } from './table-selection';

interface PosModalsProps {
  correctionError: boolean;
  correctionPending: boolean;
  correctionReason: string;
  correctionTarget?: CorrectionTarget;
  createCustomerError: unknown;
  createCustomerPending: boolean;
  customers: PosCustomer[];
  customersLoading: boolean;
  devicePath: string;
  drawerError: boolean;
  drawerPending: boolean;
  host: string;
  paymentAmount: string;
  paymentError: boolean;
  paymentErrorObject: unknown;
  paymentMethod: PaymentMethod;
  paymentOpen: boolean;
  paymentPending: boolean;
  paymentReference: string;
  port: string;
  previewText: string;
  printCanOpen: boolean;
  printError: boolean;
  printMode: PrintMode;
  printOpen: boolean;
  printPending: boolean;
  printerName: string;
  printers: PrinterInfo[];
  quickAddIndex?: number;
  quickAddItem?: PosMenuItem;
  selectedCustomer?: PosCustomer;
  selectedTableId?: string;
  tablePickerOpen: boolean;
  tablePickerLoading: boolean;
  tables: RestaurantTable[];
  total: number;
  openDrawerAfterPrint: boolean;
  onAmountChange: (value: string) => void;
  onCloseCorrection: () => void;
  onClosePayment: () => void;
  onClosePrint: () => void;
  onCloseQuickAdd: () => void;
  onCloseTablePicker: () => void;
  onConfirmQuickAdd: () => void;
  onCreateCustomer: (input: { creditLimit: number; name: string; phone: string }) => void;
  onCustomerClear: () => void;
  onCustomerSelect: (customer: PosCustomer) => void;
  onDevicePathChange: (value: string) => void;
  onDrawerChange: (value: boolean) => void;
  onHostChange: (value: string) => void;
  onKickDrawer: () => void;
  onModeChange: (value: PrintMode) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onPortChange: (value: string) => void;
  onPrinterNameChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onSelectTable: (table: RestaurantTable) => void;
  onSubmitCorrection: (event: FormSubmitEvent) => void;
  onSubmitPayment: (event: FormSubmitEvent) => void;
  onSubmitPrint: (event: FormSubmitEvent) => void;
}

export function PosModals({
  correctionError,
  correctionPending,
  correctionReason,
  correctionTarget,
  createCustomerError,
  createCustomerPending,
  customers,
  customersLoading,
  devicePath,
  drawerError,
  drawerPending,
  host,
  paymentAmount,
  paymentError,
  paymentErrorObject,
  paymentMethod,
  paymentOpen,
  paymentPending,
  paymentReference,
  port,
  previewText,
  printCanOpen,
  printError,
  printMode,
  printOpen,
  printPending,
  printerName,
  printers,
  quickAddIndex,
  quickAddItem,
  selectedCustomer,
  selectedTableId,
  tablePickerOpen,
  tablePickerLoading,
  tables,
  total,
  openDrawerAfterPrint,
  onAmountChange,
  onCloseCorrection,
  onClosePayment,
  onClosePrint,
  onCloseQuickAdd,
  onCloseTablePicker,
  onConfirmQuickAdd,
  onCreateCustomer,
  onCustomerClear,
  onCustomerSelect,
  onDevicePathChange,
  onDrawerChange,
  onHostChange,
  onKickDrawer,
  onModeChange,
  onPaymentMethodChange,
  onPortChange,
  onPrinterNameChange,
  onReasonChange,
  onReferenceChange,
  onSelectTable,
  onSubmitCorrection,
  onSubmitPayment,
  onSubmitPrint,
}: PosModalsProps) {
  return (
    <>
      <PaymentModal
        amount={paymentAmount}
        customerSection={
          <CustomerSelector
            customers={customers}
            errorMessage={apiErrorMessage(createCustomerError, '')}
            loading={customersLoading}
            pending={createCustomerPending}
            selectedCustomer={selectedCustomer}
            onClear={onCustomerClear}
            onCreate={onCreateCustomer}
            onSelect={onCustomerSelect}
          />
        }
        error={paymentError}
        errorMessage={apiErrorMessage(paymentErrorObject, 'Payment failed. Check amount and API connection.')}
        method={paymentMethod}
        open={paymentOpen}
        pending={paymentPending}
        reference={paymentReference}
        total={total}
        onAmountChange={onAmountChange}
        onClose={onClosePayment}
        onMethodChange={onPaymentMethodChange}
        onReferenceChange={onReferenceChange}
        onSubmit={onSubmitPayment}
      />

      <QuickAddConfirmModal
        item={quickAddItem}
        number={quickAddIndex === undefined ? undefined : quickAddIndex + 1}
        open={Boolean(quickAddItem)}
        onClose={onCloseQuickAdd}
        onConfirm={onConfirmQuickAdd}
      />

      <CorrectionModal
        error={correctionError}
        open={Boolean(correctionTarget)}
        pending={correctionPending}
        reason={correctionReason}
        targetLabel={correctionTarget?.label ?? ''}
        title={correctionTarget?.type === 'order' ? 'Void order' : 'Void item'}
        onClose={onCloseCorrection}
        onReasonChange={onReasonChange}
        onSubmit={onSubmitCorrection}
      />

      <TableSelectionModal
        loading={tablePickerLoading}
        open={tablePickerOpen}
        selectedTableId={selectedTableId}
        tables={tables}
        onClose={onCloseTablePicker}
        onSelect={onSelectTable}
      />

      <PrintReceiptModal
        canPrint={printCanOpen}
        devicePath={devicePath}
        drawerError={drawerError}
        drawerPending={drawerPending}
        host={host}
        mode={printMode}
        open={printOpen}
        openDrawerAfterPrint={openDrawerAfterPrint}
        port={port}
        previewText={previewText}
        printerError={printError}
        printerName={printerName}
        printerPending={printPending}
        printers={printers}
        onClose={onClosePrint}
        onDevicePathChange={onDevicePathChange}
        onDrawerChange={onDrawerChange}
        onHostChange={onHostChange}
        onKickDrawer={onKickDrawer}
        onModeChange={onModeChange}
        onPortChange={onPortChange}
        onPrinterNameChange={onPrinterNameChange}
        onSubmit={onSubmitPrint}
      />
    </>
  );
}
