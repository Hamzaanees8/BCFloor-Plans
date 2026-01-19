'use client';

import withAuth from '@/components/WithAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Page = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/calendar');
    }, [router]);

    return null;
};

export default withAuth(Page);