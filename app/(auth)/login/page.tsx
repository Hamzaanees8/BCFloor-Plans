
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function page() {
    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[410px] flex flex-col gap-[25px]'>
                <Image
                    src="/bcfloor.png"
                    alt="logo"
                    width={180}
                    height={100}
                    className="mx-auto" />

                <Link href={'#'} className='flex justify-center items-center bg-[#4290E9] hover:bg-[#357AD1] rounded-[6px] h-[44px] font-[600] text-[20px] text-[white]'>Login with Google</Link>
                <Link href={'/login-user'} className='flex justify-center items-center bg-[#fff] hover:bg-[#4290E9] hover:text-[#fff]  border-[1px] border-[#4290E9] text-[#4290E9] rounded-[6px] h-[44px] font-[600] text-[20px]'>Continue with Email</Link>
                <div className='flex justify-center'>
                    <Link href="/forget-password" className='w-fit text-[#4290E9] border-b-[1px] leading-[18px] border-[#4290E9] text-[16px] font-[400] text-center'>Forgot Password</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div>
    )
}

export default page