import {  VendorLoginIcon } from '@/components/Icons'
import Link from 'next/link'
import React from 'react'

function page() {
    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                <div className='flex justify-center'>
                    <VendorLoginIcon width='110px' height='110px' />
                </div>

                <Link href={'#'} className='flex justify-center items-center bg-[#DC9600] hover:bg-[#DC9600] rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Login with Google</Link>
                <Link href={'/agent/login-user'} className='flex justify-center items-center bg-[#fff] hover:bg-[#DC9600] hover:text-[#fff]  border-[1px] border-[#DC9600] text-[#DC9600] rounded-[6px] h-[44px] font-[600] text-[20px]'>Continue with Email</Link>
                <div className='flex justify-center'>
                    <Link href="/agent/forget-password" className='w-fit text-[#DC9600] border-b-[1px] leading-[18px] border-[#DC9600] text-[16px] font-[400] text-center'>Forgot Password</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div>
    )
}

export default page