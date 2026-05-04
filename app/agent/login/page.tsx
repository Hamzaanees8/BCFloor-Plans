import WhitelabelLogo from '@/components/WhitelabelLogo'
import { AgentLoginIcon } from '@/components/Icons'
import Link from 'next/link'
import React from 'react'

function page() {
    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                <WhitelabelLogo width={180} height={100} />
                <div className='flex justify-center'>
                    <AgentLoginIcon width='110px' height='110px' />
                </div>

                <Link href={'#'} className='hidden flex justify-center items-center bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Login with Google</Link>
                <Link href={'/agent/login-user'} className='flex justify-center items-center bg-[#fff] hover:bg-[var(--primary-color)] hover:text-[#fff]  border-[1px] border-[var(--primary-color)] text-[var(--primary-color)] rounded-[6px] h-[44px] font-[600] text-[20px]' style={{ borderColor: 'var(--primary-color)' }}>Continue with Email</Link>
                <div className='flex justify-center'>
                    <Link href="/agent/forget-password" className='w-fit text-[var(--primary-color)] border-b-[1px] leading-[18px] border-[var(--primary-color)] text-[16px] font-[400] text-center' style={{ borderColor: 'var(--primary-color)' }}>Forgot Password</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software {new Date().getFullYear()}</p>
            </div>
        </div>
    )
}

export default page