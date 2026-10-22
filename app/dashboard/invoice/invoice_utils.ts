export function isRenewalInvoice(inv: any): boolean {
  if (!inv) return false;
  if (inv.is_renewal === true || inv.invoice_type === "renewal") return true;
  const notes = (inv.notes || "").toLowerCase();
  if (
    notes.includes("hosting renewal") ||
    notes.includes("3d tour hosting renewal") ||
    notes.includes("matterport renewal") ||
    notes.includes("tour hosting renewal")
  ) {
    return true;
  }
  return (
    Array.isArray(inv.items) &&
    inv.items.some((i: any) => {
      const desc = (i.description || "").toLowerCase();
      return (
        desc.includes("hosting renewal") ||
        (desc.includes("renewal") &&
          (desc.includes("matterport") ||
            desc.includes("3d tour") ||
            desc.includes("tour hosting")))
      );
    })
  );
}

export function isMainInvoice(inv: any): boolean {
  if (!inv || isRenewalInvoice(inv)) return false;

  if (inv.is_main === true || inv.invoice_type === "main" || inv.invoice_type === "consolidated") {
    return true;
  }

  const notes = (inv.notes || "").toLowerCase();
  if (
    notes.includes("consolidated") ||
    notes.includes("main invoice") ||
    notes.includes("add-on service invoice") ||
    notes.includes("order invoice")
  ) {
    return true;
  }

  // If it's explicitly a single service invoice, it's not the main invoice
  if (notes.startsWith("service invoice:") || notes.includes("service invoice")) {
    return false;
  }

  // If it contains multiple distinct service items, it's a consolidated/main invoice
  const items = Array.isArray(inv.items) ? inv.items : [];
  const distinctServiceIds = new Set(
    items.map((i: any) => i.order_service_id).filter((id: any) => id != null)
  );
  if (distinctServiceIds.size > 1) {
    return true;
  }

  // If items length > 1 and doesn't match single service split pattern
  if (items.length > 1 && !notes.includes("invoice (")) {
    return true;
  }

  return false;
}

export function isInvoiceLinkedToService(inv: any): boolean {
  if (!inv || isRenewalInvoice(inv)) return false;

  const items = Array.isArray(inv.items) ? inv.items : [];
  if (items.length === 0) {
    return Boolean(inv.order_service_id || inv.order_service || inv.orderService);
  }

  return items.some((item: any) => {
    return Boolean(
      item.order_service_id ||
      item.order_service ||
      item.orderService
    );
  });
}

export function isOrphanInvoice(inv: any): boolean {
  if (!inv || isRenewalInvoice(inv)) return false;
  return !isInvoiceLinkedToService(inv);
}
