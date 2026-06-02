/**
 * Debug utility to help identify organization UUID issues
 * Call this in browser console to diagnose UUID problems
 */

export function debugOrganizationUUID() {
  if (typeof window === 'undefined') {
    console.error('This utility only works in browser');
    return;
  }

  console.group('🔍 Organization UUID Debug Info');
  
  // Get userInfo from localStorage
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) {
    console.error('❌ No userInfo found in localStorage');
    console.groupEnd();
    return;
  }

  try {
    const userInfo = JSON.parse(userInfoStr);
    console.log('📋 Full userInfo object:', userInfo);

    // Try different possible UUID locations
    const possibleUUIDs = {
      'organization.uuid': userInfo?.organization?.uuid,
      'data.organization.uuid': userInfo?.data?.organization?.uuid,
      'data.uuid': userInfo?.data?.uuid,
      'organization_uuid': userInfo?.organization_uuid,
      'uuid': userInfo?.uuid,
    };

    console.group('Possible UUID locations:');
    Object.entries(possibleUUIDs).forEach(([key, value]) => {
      if (value) {
        console.log(`✅ ${key}:`, value);
      } else {
        console.log(`❌ ${key}: not found`);
      }
    });
    console.groupEnd();

    // Determine which UUID should be used
    const correctUUID = userInfo?.organization?.uuid || 
                       userInfo?.data?.organization?.uuid || 
                       userInfo?.data?.uuid || 
                       userInfo?.organization_uuid;

    if (correctUUID) {
      console.log('🎯 Selected UUID to use:', correctUUID);
    } else {
      console.error('❌ Could not determine organization UUID from any location');
    }

  } catch (e) {
    console.error('❌ Error parsing userInfo:', e);
  }

  // Check AppContext organizationId
  console.group('AppContext organizationId:');
  console.log('Check the AppContext provider in your app for stored organizationId');
  console.groupEnd();

  console.groupEnd();
}

/**
 * Log API requests to see what UUIDs are being sent
 * Call this to enable API request logging
 */
export function enableAPIDebugLogging() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  window.fetch = function(...args: Parameters<typeof fetch>) {
    const [resource] = args;
    const url = typeof resource === 'string'
      ? resource
      : resource instanceof Request
        ? resource.url
        : resource.toString();
    
    // Log organization signature requests
    if (url.includes('/organizations/') && url.includes('/signatures')) {
      const match = url.match(/organizations\/([a-f0-9-]+)/);
      if (match) {
        console.log(`📤 Signature API request - Organization UUID: ${match[1]}`);
      }
    }
    
    return originalFetch(...args);
  };
  
  console.log('✅ API debug logging enabled');
}

/**
 * Compare user's actual organization with what's being sent
 */
export function compareOrganizationUUIDs() {
  const userInfoStr = localStorage.getItem('userInfo');
  if (!userInfoStr) return;

  try {
    const userInfo = JSON.parse(userInfoStr);
    const correctUUID = userInfo?.organization?.uuid;
    
    if (!correctUUID) {
      console.error('❌ Could not find organization.uuid in userInfo');
      return;
    }

    console.group('📊 UUID Comparison');
    console.log('Expected UUID:', correctUUID);
    console.log('If API returns 404, the UUID above does not exist in backend');
    console.log('Possible issues:');
    console.log('  1. Different database/environment');
    console.log('  2. Organization was deleted');
    console.log('  3. User is not properly assigned to organization');
    console.groupEnd();
  } catch (e) {
    console.error('Error:', e);
  }
}
