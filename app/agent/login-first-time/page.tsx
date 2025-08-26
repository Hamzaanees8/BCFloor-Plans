'use client'
import { AgentLoginIcon } from '@/components/Icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import React from 'react'

function Login() {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    return (
        <div className='px-[40px] md:px-0 w-full flex justify-center items-start pt-[80px]'>
            <div className='w-[400px] flex flex-col gap-[25px]'>
                <div className='flex justify-center'>
                    <AgentLoginIcon width='110px' height='110px' />
                </div>
                <div className='flex flex-col gap-[10px]'>
                    <label className='text-[14px] font-[500]' htmlFor="email">Email Address</label>
                    <Input
                        type='email'
                        placeholder='taylor.tayburn@mail.com'
                        className='h-[42px] border-[2px] border-solid border-[#BBBBBB] rounded-[6px]'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className='flex flex-col gap-[10px]'>
                    <label className='text-[14px] font-[500]' htmlFor="password">Password</label>
                    <Input
                        type='password'
                        placeholder='********'
                        className='h-[42px] border-[2px] border-solid border-[#BBBBBB] rounded-[6px]'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button className='bg-[#6BAE41] rounded-[6px] h-[44px] font-[600] text-[20px]'>Login</Button>
                <p className='text-[10px] text-[#666666] font-[400] mx-auto'>Powered by Tojuco Software 2025</p>
            </div>
        </div>
    )
}

export default Login