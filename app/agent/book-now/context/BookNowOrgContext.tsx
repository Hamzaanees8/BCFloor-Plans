'use client';

import { createContext, useContext, ReactNode } from 'react';

interface BookNowOrgContextType {
    orgSlug: string | null;
}

const BookNowOrgContext = createContext<BookNowOrgContextType>({ orgSlug: null });

export const BookNowOrgProvider = ({
    children,
    orgSlug,
}: {
    children: ReactNode;
    orgSlug: string | null;
}) => {
    return (
        <BookNowOrgContext.Provider value={{ orgSlug }}>
            {children}
        </BookNowOrgContext.Provider>
    );
};

export const useBookNowOrg = () => useContext(BookNowOrgContext);
