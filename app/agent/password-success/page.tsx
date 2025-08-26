'use client'
import { AgentLoginIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

function Page() {

    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/agent/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                <div className='flex justify-center'>
                    <AgentLoginIcon width='110px' height='110px' />
                </div>


                <Image
                    src="/ico-success.png"
                    alt="logo"
                    width={72}
                    height={72}
                    className="mx-auto" />

                <Button className='flex justify-center items-center bg-[#6BAE41] hover:bg-[#82cc55] rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Redirecting...</Button>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div>
    )
}

export default Page