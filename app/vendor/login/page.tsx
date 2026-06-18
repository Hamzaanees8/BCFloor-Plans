"use client";
import { VendorLoginIcon } from '@/components/Icons'
import WhitelabelLogo from '@/components/WhitelabelLogo'
import { useOrganization } from '@/app/context/OrganizationContext'
import Link from 'next/link'
import React from 'react'

function Page() {
    const { organization } = useOrganization();
    const hasCustomLogo = !!organization?.branding?.logo;

    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                {hasCustomLogo ? (
                    <WhitelabelLogo width={180} height={100} />
                ) : (
                    <div className='flex justify-center'>
                        <VendorLoginIcon width='110px' height='110px' />
                    </div>
                )}

                <Link href={'#'} className='hidden  justify-center items-center bg-[var(--vendor-bg-color,#DC9600)] hover:bg-[var(--vendor-bg-color,#DC9600)] hover:opacity-90 transition-all duration-200 rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Login with Google</Link>
                <Link href={'/vendor/login-user'} className='flex justify-center items-center bg-[#fff] hover:bg-[var(--vendor-bg-color,#DC9600)] hover:text-[#fff] border-[1px] border-[var(--vendor-bg-color,#DC9600)] text-[var(--vendor-bg-color,#DC9600)] transition-all duration-200 rounded-[6px] h-[44px] font-[600] text-[20px]' style={{ borderColor: 'var(--vendor-bg-color, #DC9600)' }}>Continue with Email</Link>
                <div className='flex justify-center'>
                    <Link href="/vendor/forget-password" className='w-fit text-[var(--vendor-bg-color,#DC9600)] border-b-[1px] leading-[18px] border-[var(--vendor-bg-color,#DC9600)] text-[16px] font-[400] text-center' style={{ borderColor: 'var(--vendor-bg-color, #DC9600)' }}>Forgot Password</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software {new Date().getFullYear()}</p>
            </div>
        </div>
    )
}

export default Page