'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import React, { useState } from 'react'
import { forgetPassword } from './forget-password'
import { toast } from 'sonner'
import { AgentLoginIcon } from '@/components/Icons'

function ForgotPassword() {
    const [email, setEmail] = React.useState('')
    const [errors, setErrors] = React.useState<{ email: boolean }>({
        email: false,
    })
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        const isValidEmail = (email: string) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

        const newErrors = {
            email: email.trim() === '' || !isValidEmail(email),
        };

        setErrors(newErrors)

        const hasError = Object.values(newErrors).some(Boolean)
        if (hasError) return

        try {
            setIsLoading(true)
            const response = await forgetPassword({ email });
            console.log('Email send successfully:', response);
            toast.success('A reset link has been sent to your email.')
            setIsLoading(false)
            // router.push('dashboard')
        } catch (error: unknown) {
            setIsLoading(false)
            if (error instanceof Error) {
                setIsLoading(false)
                console.error(error.message);
                toast.error(error.message)
            }
        }
    };
    return (
        <div className='w-full flex justify-center items-start pt-[80px] px-[40px] md:px-0'>
            <div className='w-[400px] flex flex-col gap-[25px]'>
                <div className='flex justify-center'>
                    <AgentLoginIcon width='110px' height='110px' />
                </div>
                <form className='flex flex-col gap-[10px]' onSubmit={(e) => handleSubmit(e)}>
                    <label className={`text-[14px] font-[500] ${errors.email ? 'text-red-500' : ''}`} htmlFor="email">Email Address</label>
                    <Input
                        type='email'
                        placeholder='taylor.tayburn@mail.com'
                        className={`h-[42px] border-[2px] border-solid border-[#BBBBBB] rounded-[6px] ${errors.email ? 'border-red-500' : 'border-[#BBBBBB]'}`}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            if (errors.email && e.target.value.trim() !== '') {
                                setErrors(prev => ({ ...prev, email: false }))
                            }
                        }}
                    />
                    {errors.email && (
                        <span className="text-red-500 text-sm">Enter a valid email</span>
                    )}
                    <Button
                        disabled={isLoading}
                        onClick={handleSubmit} className='flex justify-center items-center bg-[#6BAE41] hover:bg-[#80c952] rounded-[6px] h-[42px] font-[600] text-[20px] text-[white]'> {isLoading ? (
                            <div role="status">
                                <svg
                                    aria-hidden="true"
                                    className="w-[28px] h-[28px] text-gray-600 animate-spin fill-[#fff]"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                        ) : (
                            "Send Reset Link"
                        )} </Button>
                </form>
                <div className='flex justify-center'>
                    <Link href="agent/login-user" className='w-fit text-[#6BAE41] border-b-[1px] leading-[18px] border-[#6BAE41] text-[16px] font-[400] text-center'>Back to Login</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div >
    )
}

export default ForgotPassword