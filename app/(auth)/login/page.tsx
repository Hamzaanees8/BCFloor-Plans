
import WhitelabelLogo from '@/components/WhitelabelLogo'
import Link from 'next/link'
import React from 'react'

function page() {
    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                <WhitelabelLogo width={180} height={100} />

                <Link href={'#'} className='hidden flex justify-center items-center bg-[var(--org-primary,#4290E9)] hover:opacity-90 rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Login with Google</Link>
                <Link href={'/login-user'} className='flex justify-center items-center bg-[#fff] hover:bg-[var(--org-primary,#4290E9)] hover:text-[#fff]  border-[1px] border-[var(--org-primary,#4290E9)] text-[var(--org-primary,#4290E9)] rounded-[6px] h-[44px] font-[600] text-[20px]'>Continue with Email</Link>
                <div className='flex justify-center'>
                    <Link href="/forget-password" className='w-fit text-[var(--org-primary,#4290E9)] border-b-[1px] leading-[18px] border-[var(--org-primary,#4290E9)] text-[16px] font-[400] text-center'>Forgot Password</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software {new Date().getFullYear()}</p>
            </div>
        </div>
    )
}

export default page