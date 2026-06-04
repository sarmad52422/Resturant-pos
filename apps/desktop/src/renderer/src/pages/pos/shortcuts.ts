import { useEffect, type RefObject } from 'react';
import type { OrderType } from '@/store/use-pos-store';

interface PosShortcutOptions {
  canOpenPayment: boolean;
  canOpenPrint: boolean;
  canPrintReceipt: boolean;
  canSendToKitchen: boolean;
  printOpen: boolean;
  quickAddConfirmOpen: boolean;
  quickAddCount: number;
  quickAddEnabled: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  sendToKitchen: () => void;
  setOrderType: (type: OrderType) => void;
  onClosePayment: () => void;
  onClosePrint: () => void;
  onConfirmQuickAdd: () => void;
  onNavigateTables: () => void;
  onOpenPayment: () => void;
  onOpenPrint: () => void;
  onPrintReceipt: () => void;
  onQuickAddItem: (index: number) => void;
}

export function usePosShortcuts({
  canOpenPayment,
  canOpenPrint,
  canPrintReceipt,
  canSendToKitchen,
  printOpen,
  quickAddConfirmOpen,
  quickAddCount,
  quickAddEnabled,
  searchInputRef,
  sendToKitchen,
  setOrderType,
  onClosePayment,
  onClosePrint,
  onConfirmQuickAdd,
  onNavigateTables,
  onOpenPayment,
  onOpenPrint,
  onPrintReceipt,
  onQuickAddItem,
}: PosShortcutOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const editableTarget = isEditableTarget(event.target);
      const searchFocused = event.target === searchInputRef.current;
      const quickAddIndex = getQuickAddIndex(event);

      const quickAddAllowedTarget = !editableTarget || searchFocused;
      const quickAddModifier = event.altKey || isCtrlOrMeta || (event.shiftKey && searchFocused);

      if (quickAddConfirmOpen && event.key === 'Enter') {
        event.preventDefault();
        onConfirmQuickAdd();
        return;
      }

      if (quickAddEnabled && quickAddAllowedTarget && quickAddIndex !== undefined && quickAddIndex < quickAddCount && quickAddModifier) {
        event.preventDefault();
        onQuickAddItem(quickAddIndex);
        return;
      }

      if (searchFocused && event.key === 'Enter' && quickAddCount > 0) {
        event.preventDefault();
        onQuickAddItem(0);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClosePayment();
        onClosePrint();
        return;
      }

      if (event.key === 'F2') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === 'F5') {
        event.preventDefault();
        if (canSendToKitchen) sendToKitchen();
        return;
      }

      if (event.key === 'F6' || (isCtrlOrMeta && key === 'p')) {
        event.preventDefault();
        if (canOpenPrint) onOpenPrint();
        return;
      }

      if (event.key === 'F7') {
        event.preventDefault();
        if (canOpenPayment) onOpenPayment();
        return;
      }

      if (event.key === 'F10') {
        event.preventDefault();
        onNavigateTables();
        return;
      }

      if (isCtrlOrMeta && key === 'd') {
        event.preventDefault();
        setOrderType('DELIVERY');
        return;
      }

      if (isCtrlOrMeta && key === 't') {
        event.preventDefault();
        setOrderType('TAKEAWAY');
        return;
      }

      if (isCtrlOrMeta && key === 'i') {
        event.preventDefault();
        setOrderType('DINE_IN');
        return;
      }

      if (!editableTarget && printOpen && key === 'p' && !event.altKey && !isCtrlOrMeta && !event.shiftKey) {
        event.preventDefault();
        if (canPrintReceipt) onPrintReceipt();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canOpenPayment,
    canOpenPrint,
    canPrintReceipt,
    canSendToKitchen,
    printOpen,
    quickAddConfirmOpen,
    quickAddCount,
    quickAddEnabled,
    searchInputRef,
    sendToKitchen,
    setOrderType,
    onClosePayment,
    onClosePrint,
    onConfirmQuickAdd,
    onNavigateTables,
    onOpenPayment,
    onOpenPrint,
    onPrintReceipt,
    onQuickAddItem,
  ]);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'select' || tagName === 'textarea' || target.isContentEditable;
}

function getQuickAddIndex(event: KeyboardEvent) {
  if (event.code.startsWith('Digit')) {
    const digit = Number(event.code.replace('Digit', ''));
    return digit >= 1 && digit <= 9 ? digit - 1 : undefined;
  }

  if (event.code.startsWith('Numpad')) {
    const digit = Number(event.code.replace('Numpad', ''));
    return digit >= 1 && digit <= 9 ? digit - 1 : undefined;
  }

  return undefined;
}
