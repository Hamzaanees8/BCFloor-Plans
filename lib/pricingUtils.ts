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
    (o) => (!o.sq_ft_range || typeof o.sq_ft_range !== 'string' || o.sq_ft_range.trim() === '') &&
           o.sq_ft_rate && parseFloat(o.sq_ft_rate) > 0
  );
  if (!opt) return null;
  return {
    rate: parseFloat(opt.sq_ft_rate),
    minPrice: opt.min_price ? parseFloat(opt.min_price) : 0,
  };
};

/**
 * Check if a square footage value falls within a sq_ft_range string.
 * Supports formats: "0-1000", "2001-3000", "10001-+", "10001+".
 */
export const isSqFtInRange = (sqFtRange: string | undefined | null, sqft: number): boolean => {
  if (!sqFtRange || typeof sqFtRange !== 'string') return false;
  const cleaned = sqFtRange.replace(/\s+/g, '');
  
  if (cleaned.includes('+')) {
    const minStr = cleaned.replace(/\+|-/g, '');
    const min = parseInt(minStr, 10);
    return !isNaN(min) && sqft >= min;
  }

  const [minStr, maxStr] = cleaned.split('-').map((s: string) => s.trim());
  const min = parseInt(minStr, 10);
  const max = parseInt(maxStr, 10);

  if (isNaN(min)) return false;
  if (isNaN(max)) return sqft >= min;

  return sqft >= min && sqft <= max;
};

/**
 * Find the tier with the HIGHEST max sqft bound.
 * Used for out-of-range extrapolation — always use the most expensive tier
 * as the rate basis, never an arbitrary nearest tier.
 */
const getHighestSqftTier = (
  ranged: any[]
): { max: number; amount: number; minPrice: number } | null => {
  let highMax = -Infinity;
  let highTier: any = null;
  for (const o of ranged) {
    const cleaned = (o.sq_ft_range as string).replace(/\s+/g, '');
    let bound: number;
    if (cleaned.includes('+')) {
      // "10001+" style — treat the lower bound as the reference
      bound = parseInt(cleaned.replace(/[^0-9]/g, ''), 10);
    } else {
      const parts = cleaned.split('-');
      bound = parseInt(parts[parts.length - 1], 10);
    }
    if (!isNaN(bound) && bound > highMax) {
      highMax = bound;
      highTier = o;
    }
  }
  if (!highTier) return null;
  return {
    max: highMax,
    amount: parseFloat(highTier.amount),
    minPrice: highTier.min_price ? parseFloat(highTier.min_price) : 0,
  };
};

/**
 * Calculate custom SqFt price using the priority system:
 *   1. Explicit sq_ft_rate option  (e.g. 2D Floor Plans: rate × sqft)
 *   2. In-range exact tier match   (return flat amount)
 *   3. Out-of-range extrapolation  (highest-tier rate × sqft)
 * Returns null if price cannot be determined.
 */
export const calcCustomSqftPrice = (
  options: any[],
  sqft: number
): { price: number; rate: number; method: 'explicit' | 'range-division' } | null => {
  if (!options || options.length === 0 || sqft <= 0) return null;

  // Priority 1 – explicit per-sqft rate (no range attached)
  const explicit = getExplicitSqftRate(options);
  if (explicit) {
    const price = Math.max(sqft * explicit.rate, explicit.minPrice);
    return { price, rate: explicit.rate, method: 'explicit' };
  }

  // Collect all range-based tiers
  const ranged = options.filter(
    (o) => o.sq_ft_range && typeof o.sq_ft_range === 'string' && o.sq_ft_range.trim() !== '' && o.amount
  );
  if (ranged.length === 0) return null;

  // Priority 2 – exact in-range match → return flat amount
  const exact = ranged.find((o) => isSqFtInRange(o.sq_ft_range, sqft));
  if (exact) {
    const price = parseFloat(exact.amount);
    // Return a meaningful rate so formula hints display correctly
    const rate = sqft > 0 ? price / sqft : 0;
    return { price, rate, method: 'range-division' };
  }

  // Priority 3 – out-of-range: extrapolate using the HIGHEST tier
  const highest = getHighestSqftTier(ranged);
  if (!highest || highest.max <= 0) return null;

  const rate = highest.amount / highest.max;
  const rawPrice = sqft * rate;
  const price = highest.minPrice > 0 ? Math.max(rawPrice, highest.minPrice) : rawPrice;
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
    (o) => !o.quantity && o.quantity_rate && parseFloat(o.quantity_rate) > 0
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
 *   1. Explicit quantity_rate option  (qty × explicit rate)
 *   2. Exact tier match               (return flat amount)
 *   3. Out-of-range extrapolation     (highest-tier rate × qty)
 * Returns null if price cannot be determined.
 */
export const calcCustomQtyPrice = (
  options: any[],
  qty: number
): { price: number; rate: number; method: 'explicit' | 'qty-division' } | null => {
  if (!options || options.length === 0 || qty <= 0) return null;

  // Priority 1 – explicit per-unit rate
  const explicit = getExplicitQtyRate(options);
  if (explicit) {
    const price = Math.max(qty * explicit.rate, explicit.minPrice);
    return { price, rate: explicit.rate, method: 'explicit' };
  }

  // Collect all quantity tiers
  const quantified = options.filter((o) => o.quantity && o.amount);
  if (quantified.length === 0) return null;

  // Priority 2 – exact quantity match → return flat amount
  const exact = quantified.find((o) => Number(o.quantity) === qty);
  if (exact) {
    const price = parseFloat(exact.amount);
    const rate = qty > 0 ? price / qty : 0;
    return { price, rate, method: 'qty-division' };
  }

  // Priority 3 – out-of-range: extrapolate using the HIGHEST quantity tier
  const highest = quantified.reduce((best: any, o: any) => {
    return Number(o.quantity) > Number(best?.quantity ?? -1) ? o : best;
  }, null as any);
  if (!highest) return null;

  const baseQty = Number(highest.quantity) || 1;
  const rate = parseFloat(highest.amount) / baseQty;
  const rawPrice = qty * rate;
  const minPrice = highest.min_price ? parseFloat(highest.min_price) : 0;
  const price = minPrice > 0 ? Math.max(rawPrice, minPrice) : rawPrice;
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
        const matchingItems = invoice.items.filter(
          (i: any) =>
            i.order_service_id === orderService.id ||
            i.orderService?.id === orderService.id
        );
        
        if (matchingItems.length > 0) {
          const totalAmount = matchingItems.reduce((sum: number, item: any) => {
            const itemAmount = parseFloat(item.amount) || ((parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0));
            return sum + itemAmount;
          }, 0);
          
          if (totalAmount > 0) {
            return totalAmount;
          }
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
    if (
      bookedOption &&
      (!bookedOption.sq_ft_range || String(bookedOption.sq_ft_range).trim() === '') &&
      bookedOption.sq_ft_rate &&
      parseFloat(bookedOption.sq_ft_rate) > 0
    ) {
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
