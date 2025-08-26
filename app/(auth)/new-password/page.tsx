import React, { Suspense } from 'react'
import NewPasswordForm from '@/components/NewPasswordForm'

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPasswordForm />
        </Suspense>
    )
}
