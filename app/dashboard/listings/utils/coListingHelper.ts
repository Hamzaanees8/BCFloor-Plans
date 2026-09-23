/**
 * Helper to determine if a listing is a Co-Listing or Primary Listing for the logged-in agent,
 * or whether co-agents are associated with the listing.
 */

export interface CoListingStatus {
  isCoListing: boolean;
  isPrimaryListing: boolean;
  hasCoAgents: boolean;
  badgeLabel: 'Co-Listing' | 'Primary Listing' | null;
  coAgentNames: string[];
}

export function getCoListingStatus(
  listing: any,
  userType: string,
  userInfo?: any
): CoListingStatus {
  if (!listing) {
    return {
      isCoListing: false,
      isPrimaryListing: false,
      hasCoAgents: false,
      badgeLabel: null,
      coAgentNames: [],
    };
  }

  // Parse co_agents list from listing, property, or orders
  const rawCoAgents =
    listing.co_agents ||
    listing.property?.co_agents ||
    listing.coagents ||
    [];

  let coAgentsList: any[] = [];
  if (Array.isArray(rawCoAgents)) {
    coAgentsList = rawCoAgents;
  } else if (typeof rawCoAgents === 'string') {
    try {
      const parsed = JSON.parse(rawCoAgents);
      if (Array.isArray(parsed)) coAgentsList = parsed;
    } catch {
      coAgentsList = [];
    }
  }

  // Also check orders for co_agents
  if (coAgentsList.length === 0 && listing.orders && Array.isArray(listing.orders)) {
    for (const order of listing.orders) {
      const orderCo = order.co_agents || order.coagents;
      if (Array.isArray(orderCo) && orderCo.length > 0) {
        coAgentsList = orderCo;
        break;
      } else if (typeof orderCo === 'string') {
        try {
          const parsed = JSON.parse(orderCo);
          if (Array.isArray(parsed) && parsed.length > 0) {
            coAgentsList = parsed;
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const coAgentNames = coAgentsList
    .map((ca: any) => ca.name || `${ca.first_name || ''} ${ca.last_name || ''}`.trim() || ca.email)
    .filter(Boolean);

  const hasCoAgents = coAgentsList.length > 0;

  if (userType === 'agent') {
    const userEmail = (userInfo?.email || userInfo?.data?.email || '').toLowerCase().trim();
    const userId = userInfo?.id || userInfo?.data?.id;
    const userUuid = userInfo?.uuid || userInfo?.data?.uuid;
    const agentType = userInfo?.agent_type || userInfo?.data?.agent_type;

    // Explicit flag from API
    if (listing.is_co_listing === true) {
      return {
        isCoListing: true,
        isPrimaryListing: false,
        hasCoAgents,
        badgeLabel: 'Co-Listing',
        coAgentNames,
      };
    }

    // Check if user's email matches any co-agent
    const matchesCoAgentEmail = coAgentsList.some((ca: any) => {
      const caEmail = (ca.email || (typeof ca === 'string' ? ca : '')).toLowerCase().trim();
      return caEmail && userEmail && caEmail === userEmail;
    });

    if (matchesCoAgentEmail) {
      return {
        isCoListing: true,
        isPrimaryListing: false,
        hasCoAgents,
        badgeLabel: 'Co-Listing',
        coAgentNames,
      };
    }

    // Check if current user is the primary agent
    const listingAgentId = listing.agent_id || listing.agent?.id;
    const listingAgentUuid = listing.agent?.uuid;
    const listingAgentEmail = (listing.agent?.email || '').toLowerCase().trim();

    const isPrimary =
      (userId && listingAgentId && String(userId) === String(listingAgentId)) ||
      (userUuid && listingAgentUuid && userUuid === listingAgentUuid) ||
      (userEmail && listingAgentEmail && userEmail === listingAgentEmail);

    if (isPrimary) {
      return {
        isCoListing: false,
        isPrimaryListing: true,
        hasCoAgents,
        badgeLabel: hasCoAgents ? 'Primary Listing' : null,
        coAgentNames,
      };
    }

    // If logged in user is a co_agent account type and not primary, treat as Co-Listing
    if (agentType === 'co_agent') {
      return {
        isCoListing: true,
        isPrimaryListing: false,
        hasCoAgents,
        badgeLabel: 'Co-Listing',
        coAgentNames,
      };
    }

    // Fallback: If co-agents exist on the listing
    if (hasCoAgents) {
      return {
        isCoListing: false,
        isPrimaryListing: true,
        hasCoAgents: true,
        badgeLabel: 'Primary Listing',
        coAgentNames,
      };
    }
  }

  // Admin & Vendor View:
  if (hasCoAgents) {
    return {
      isCoListing: false,
      isPrimaryListing: false,
      hasCoAgents: true,
      badgeLabel: 'Co-Listing',
      coAgentNames,
    };
  }

  return {
    isCoListing: false,
    isPrimaryListing: false,
    hasCoAgents: false,
    badgeLabel: null,
    coAgentNames: [],
  };
}
