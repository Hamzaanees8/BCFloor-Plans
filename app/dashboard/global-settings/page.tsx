"use client"
import GlobalSettings from '@/components/GlobalSettings'
import React from 'react'
import VendorForm from '../vendors/create/page'
import { useAppContext } from '@/app/context/AppContext'
import AgentForm from '../agents/create/page'

const Page = () => {
    const { userType } = useAppContext()
    return (
        <div className='font-alexandria'>
            {userType === "agent" &&
                <AgentForm />
            }
            {userType === "admin" &&
                <GlobalSettings />
            }
            {userType === "vendor" &&
                <VendorForm />
            }
        </div>
    )
}

export default Page