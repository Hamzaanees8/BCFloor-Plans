// ---------------------------------------------------------------------------
// SqFt (Area) pricing helpers
// ---------------------------------------------------------------------------

/**
 * Method A – return the explicit sq_ft_rate from an option, if one exists.
 */
export const getExplicitSqftRate = (
  options: any[]
): { rate: number; minPrice: number } | null => {
  if (!options || options.length === 0) return null;
  const opt = options.find(
    (o) => o.sq_ft_rate && parseFloat(o.sq_ft_rate) > 0
  );
  if (!opt) return null;
  return {
    rate: parseFloat(opt.sq_ft_rate),
    minPrice: opt.min_price ? parseFloat(opt.min_price) : 0,
  };
};

/**
 * Method B – find the nearest range option to the given sqft value.
 * "Nearest" means: prefer options whose range contains the value; if none
 * match, use the option whose MAX bound is closest to the value.
 */
export const getNearestSqftOption = (
  options: any[],
  sqft: number
): any | null => {
  if (!options || options.length === 0) return null;

  const ranged = options.filter(
    (o) => o.sq_ft_range && typeof o.sq_ft_range === 'string' && o.amount
  );
  if (ranged.length === 0) return null;

  // Try exact match first
  const exact = ranged.find((o) => {
    const [minStr, maxStr] = o.sq_ft_range.split('-').map((s: string) => s.trim());
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    return !isNaN(min) && !isNaN(max) && sqft >= min && sqft <= max;
  });
  if (exact) return exact;

  // Fallback: nearest by distance of the MAX bound to the requested sqft
  let closest: any = null;
  let closestDist = Infinity;
  for (const o of ranged) {
    const [, maxStr] = o.sq_ft_range.split('-').map((s: string) => s.trim());
    const max = parseInt(maxStr, 10);
    if (isNaN(max)) continue;
    const dist = Math.abs(sqft - max);
    if (dist < closestDist) {
      closestDist = dist;
      closest = o;
    }
  }
  return closest;
};

/**
 * Calculate custom SqFt price using the priority system:
 *   1. Explicit sq_ft_rate option
 *   2. Nearest range-based division (amount / rangeMax)
 * Returns null if price cannot be determined.
 */
export const calcCustomSqftPrice = (
  options: any[],
  sqft: number
): { price: number; rate: number; method: 'explicit' | 'range-division' } | null => {
  if (!options || options.length === 0 || sqft <= 0) return null;

  // Priority 1 – explicit rate
  const explicit = getExplicitSqftRate(options);
  if (explicit) {
    const price = Math.max(sqft * explicit.rate, explicit.minPrice);
    return { price, rate: explicit.rate, method: 'explicit' };
  }

  // Priority 2 – nearest range
  const nearest = getNearestSqftOption(options, sqft);
  if (!nearest) return null;

  const [, maxStr] = nearest.sq_ft_range.split('-').map((s: string) => s.trim());
  const rangeMax = parseInt(maxStr, 10);
  if (isNaN(rangeMax) || rangeMax <= 0) return null;

  const rate = parseFloat(nearest.amount) / rangeMax;
  const rawPrice = sqft * rate;
  const minPrice = nearest.min_price ? parseFloat(nearest.min_price) : 0;
  const price = Math.max(rawPrice, minPrice);
  return { price, rate, method: 'range-division' };
};

// ---------------------------------------------------------------------------
// Quantity pricing helpers
// ---------------------------------------------------------------------------

/**
 * Method A – return the explicit quantity_rate from an option, if one exists.
 */
export const getExplicitQtyRate = (
  options: any[]
): { rate: number; minPrice: number } | null => {
  if (!options || options.length === 0) return null;
  const opt = options.find(
    (o) => o.quantity_rate && parseFloat(o.quantity_rate) > 0
  );
  if (!opt) return null;
  return {
    rate: parseFloat(opt.quantity_rate),
    minPrice: opt.min_price ? parseFloat(opt.min_price) : 0,
  };
};

/**
 * Method B – find the nearest quantity option.
 * Prefer the option whose quantity is closest to the requested value.
 */
export const getNearestQtyOption = (options: any[], qty: number): any | null => {
  if (!options || options.length === 0) return null;
  const quantified = options.filter((o) => o.quantity && o.amount);
  if (quantified.length === 0) return null;

  // Try exact match first
  const exact = quantified.find((o) => Number(o.quantity) === qty);
  if (exact) return exact;

  // Nearest by distance
  let closest: any = null;
  let closestDist = Infinity;
  for (const o of quantified) {
    const dist = Math.abs(Number(o.quantity) - qty);
    if (dist < closestDist) {
      closestDist = dist;
      closest = o;
    }
  }
  return closest;
};

/**
 * Calculate custom Quantity price using the priority system:
 *   1. Explicit quantity_rate option
 *   2. Nearest quantity-based division (amount / quantity)
 * Returns null if price cannot be determined.
 */
export const calcCustomQtyPrice = (
  options: any[],
  qty: number
): { price: number; rate: number; method: 'explicit' | 'qty-division' } | null => {
  if (!options || options.length === 0 || qty <= 0) return null;

  // Priority 1 – explicit rate
  const explicit = getExplicitQtyRate(options);
  if (explicit) {
    const price = Math.max(qty * explicit.rate, explicit.minPrice);
    return { price, rate: explicit.rate, method: 'explicit' };
  }

  // Priority 2 – nearest quantity option
  const nearest = getNearestQtyOption(options, qty);
  if (!nearest) return null;

  const baseQty = Number(nearest.quantity) || 1;
  const rate = parseFloat(nearest.amount) / baseQty;
  const rawPrice = qty * rate;
  const minPrice = nearest.min_price ? parseFloat(nearest.min_price) : 0;
  const price = Math.max(rawPrice, minPrice);
  return { price, rate, method: 'qty-division' };
};

// ---------------------------------------------------------------------------
// Legacy helpers kept for backward compat
// ---------------------------------------------------------------------------

export const isPerSqftOptionTitle = (title?: string): boolean => {
  if (!title) return false;
  const t = title.toLowerCase();
  return (
    t.includes('per sq ft') ||
    t.includes('/sqft') ||
    t.includes('per square footage') ||
    t.includes('per sq. ft.') ||
    t.includes('per sqft') ||
    t.includes('per square foot')
  );
};

export const estimatePerSqftRate = (options: any[]): number => {
  const result = calcCustomSqftPrice(options, 1000);
  return result ? parseFloat((result.rate).toFixed(4)) : 0;
};

export const computePerSqftPrice = (
  squareFootage: number,
  rate: number,
  minPrice?: number
): number => {
  const calculated = squareFootage * rate;
  return minPrice && minPrice > 0 ? Math.max(calculated, minPrice) : calculated;
};

// ---------------------------------------------------------------------------
// Unified Service Price Resolver
// ---------------------------------------------------------------------------

/**
 * Resolves the display price for a booked service using the priority:
 * 1. Invoice line item (most accurate — confirmed by server)
 * 2. sq_ft_rate × squareFootage (catalog fallback)
 * 3. option.amount (flat price fallback)
 * 4. orderService.amount (raw backend value)
 */
export const resolveServicePrice = (params: {
  orderService: any;
  catalogService?: any;
  squareFootage: number;
  invoices?: any[];
}): number => {
  const { orderService, catalogService, squareFootage, invoices } = params;
  if (!orderService) return 0;

  // 1. Check invoices
  if (invoices && invoices.length > 0) {
    for (const invoice of invoices) {
      if (invoice.items && invoice.items.length > 0) {
        const item = invoice.items.find(
          (i: any) =>
            i.order_service_id === orderService.id ||
            i.orderService?.id === orderService.id
        );
        if (item && item.unit_price) {
          const qty = parseFloat(item.quantity) || 1;
          const unitPrice = parseFloat(item.unit_price) || 0;
          return qty * unitPrice;
        }
      }
    }
  }

  // 2. Check sq ft calculation
  const options = catalogService?.product_options || [];
  if (squareFootage > 0 && options.length > 0) {
    // Only apply sqft pricing if the booked option actually has a sq_ft_rate or matches one.
    // Usually, the booked option itself has the sq_ft_rate.
    const bookedOption = orderService.option;
    if (bookedOption && bookedOption.sq_ft_rate && parseFloat(bookedOption.sq_ft_rate) > 0) {
      const rate = parseFloat(bookedOption.sq_ft_rate);
      const minPrice = parseFloat(bookedOption.min_price || '0');
      return Math.max(rate * squareFootage, minPrice);
    }
  }

  // 3. Flat price fallback from booked option
  if (orderService.option && orderService.option.amount) {
    return parseFloat(orderService.option.amount);
  }

  // 4. Raw amount fallback
  if (orderService.amount) {
    return parseFloat(orderService.amount);
  }

  return 0;
};
