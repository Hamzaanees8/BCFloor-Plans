'use client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

function Page() {
    
        const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);
    
    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                <Image
                    src="/tojuco.png"
                    alt="logo"
                    width={180}
                    height={100}
                    className="mx-auto" />

                    
                <Image
                    src="/ico-success.png"
                    alt="logo"
                    width={72}
                    height={72}
                    className="mx-auto" />

                <Button className='flex justify-center items-center bg-[#4290E9] hover:bg-[#357AD1] rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Redirecting...</Button>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div>
    )
}

export default Page