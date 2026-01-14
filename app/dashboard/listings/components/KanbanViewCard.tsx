import { Eye } from 'lucide-react'
import React from 'react'
import { useAppContext } from '@/app/context/AppContext'
import { Listings } from '../page'

interface KanbanViewCardProps {
  listing: Listings;
  onQuickView: () => void;
}

const KanbanViewCard = ({ listing, onQuickView }: KanbanViewCardProps) => {
  const { userType } = useAppContext()

  const file_path = listing?.orders?.[0]?.tours?.[0]?.files?.find(
    file => file.is_featured === true
  )?.file_path ||
    listing?.orders?.[0]?.tours?.[0]?.files?.[0]?.file_path;

  return (
    <div className='flex flex-col w-full bg-white'>
      <div className='flex items-center justify-center gap-2 bg-[#D9D8D8] w-full h-[173px]'
        style={{
          backgroundImage: `url('${process.env.NEXT_PUBLIC_FILES_API_URL}/${file_path}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
        {file_path == undefined && (
          <p className='text-[12px] font-[500] text-[#666666]'>
            No Thumbnail Available
          </p>
        )}
      </div>
      <div className='flex items-center justify-between gap-4 p-2'>
        <p className={`${userType}-text text-[11px] truncate`}>
          {listing?.address + ", " + listing?.city}
        </p>
        <Eye
          className='w-5 text-[#7D7D7D] cursor-pointer'
          onClick={onQuickView}
        />
      </div>
    </div >
  )
}

export default KanbanViewCard