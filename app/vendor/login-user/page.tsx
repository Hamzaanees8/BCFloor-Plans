'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import React, { useState } from 'react'
import { login } from './login'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { VendorLoginIcon } from '@/components/Icons'
import { useAppContext } from '@/app/context/AppContext'

function LoginUser() {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [errors, setErrors] = React.useState<{ email: boolean; password: boolean }>({
        email: false,
        password: false,
    })
    const [isLoading, setIsLoading] = useState(false);
    const { setUserType } = useAppContext();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {

        e.preventDefault();
        const isValidEmail = (email: string) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

        const newErrors = {
            email: email.trim() === '' || !isValidEmail(email),
            password: password.trim() === '' || password.length < 6,
        };

        setErrors(newErrors)

        const hasError = Object.values(newErrors).some(Boolean)
        if (hasError) return
        setIsLoading(true)
        try {
            const response = await login({ email, password, role: 'vendor' });

            console.log('Login successful:', response);
            toast.success('Login successfully')
            router.push('/dashboard/orders')
            localStorage.setItem('token', response.data.token);
            setIsLoading(false)
            setUserType("vendor")
            localStorage.setItem('userType', 'vendor')
            localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        } catch (error: unknown) {
            if (error instanceof Error) {
                setIsLoading(false)
                console.error(error.message);
                toast.error(error.message)
            }
            setIsLoading(false)
        }
    };


    return (
        <div className='w-full flex justify-center items-start pt-[80px] px-[40px] md:px-0'>
            <div className='w-[400px] flex flex-col gap-[25px]'>
                <div className='flex justify-center'>
                    <VendorLoginIcon width='110px' height='110px' />
                </div>
                <Link href={'#'} className='flex justify-center items-center bg-[#DC9600] hover:bg-[#DC9600] hover:opacity-85 rounded-[6px] h-[42px] font-[600] text-[20px] text-[white]'>Login with Google</Link>
                <div className='flex flex-col gap-[10px]'>
                    <label className={`text-[14px] font-[500] ${errors.email ? 'text-red-500' : ''}`} htmlFor="email">Email Address</label>
                    <Input
                        type='email'
                        id='email'
                        name='email'
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
                </div>
                <div className='flex flex-col gap-[10px]'>
                    <label
                        className={`text-[14px] font-[500] ${errors.password ? 'text-red-500' : ''}`}
                        htmlFor="password">Password</label>
                    <Input
                        id='password'
                        name='password'
                        type='password'
                        placeholder='********'
                        className={`h-[42px] border-[2px] border-solid border-[#BBBBBB] rounded-[6px] ${errors.password ? 'border-red-500' : 'border-[#BBBBBB]'}`}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            if (errors.password && e.target.value.trim() !== '') {
                                setErrors(prev => ({ ...prev, password: false }))
                            }
                        }}
                    />
                </div>
                <Button
                    onClick={(e) => handleLogin(e)}
                    disabled={isLoading}
                    className={`flex justify-center items-center ${isLoading ? 'bg-[#DC9600]' : 'bg-[#fff]'}  hover:bg-[#DC9600] hover:text-[#fff] border-[1px] border-[#DC9600] text-[#DC9600] rounded-[6px] h-[42px] font-[600] text-[20px]`}>
                    {isLoading ? (
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
                        "Login"
                    )}
                </Button>
                <div className='flex justify-center'>
                    <Link href="/vendor/forget-password" className='w-fit text-[#DC9600] border-b-[1px] leading-[18px] border-[#DC9600] text-[16px] font-[400] text-center'>Forgot Password</Link>
                </div>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div>
    )
}

export default LoginUser