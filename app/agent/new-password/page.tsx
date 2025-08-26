import React, { Suspense } from 'react'
import AgentNewPasswordForm from '@/components/AgentNewPasswordForm'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AgentNewPasswordForm />
        </Suspense>
    )
}
