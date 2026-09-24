"use client"
import React, { useEffect, useState } from 'react'
import VendorForm from '../vendors/create/page'
import { useAppContext } from '@/app/context/AppContext'
import AgentForm from '../agents/create/page'

const Page = () => {
    const { userType } = useAppContext()
    const [effectiveUserType, setEffectiveUserType] = useState<string>('')

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('userType') : ''
        setEffectiveUserType(userType || stored || '')
    }, [userType])

    const currentType = userType || effectiveUserType

    return (
        <div className='font-alexandria'>
            {(currentType === "agent" || currentType === "co_agent") &&
                <AgentForm />
            }
            {currentType === "vendor" &&
                <VendorForm />
            }
        </div>
    )
}

export default Page

