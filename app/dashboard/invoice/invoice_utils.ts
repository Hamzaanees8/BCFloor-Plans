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
