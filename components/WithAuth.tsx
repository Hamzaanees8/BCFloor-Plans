'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>): React.FC<P> {
  const Wrapper: React.FC<P> = (props: P) => {
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
}

export default withAuth;
