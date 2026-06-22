'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Share2, Eye, ImageOff, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { GetPublicTours } from '@/app/agent/agent'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { toast } from 'sonner'
import type { Tour } from '@/lib/types'

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')

function getFeaturedImage(tour: Tour): string | null {
  if (!tour.files || tour.files.length === 0) return null
  const featured = tour.files.find((f) => f.is_featured)
  const file = featured || tour.files[0]
  return file?.thumbnail_url || file?.file_path || null
}

function getTourUrl(tour: Tour): string {
  const address = tour.orders?.property_address || tour.orders?.property?.address || ''
  const orderUuid = tour.orders?.uuid || ''
  return `/tour/${slugify(address)}/${orderUuid}`
}

function getPropertyStatus(tour: Tour): string | null {
  return tour.orders?.property?.property_status || null
}

function getPropertyStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'sold':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function TourCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="w-full h-[180px]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>
    </Card>
  )
}

export default function MobileAgentTours() {
  const { appliedSettings } = useWhiteLabel()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const agentColor = appliedSettings?.agent?.pageTabColor || '#6BAE41'

  useEffect(() => {
    async function fetchTours() {
      try {
        const res = await GetPublicTours()
        const data = res.data || res || []
        setTours(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch tours:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTours()
  }, [])

  const filteredTours = useMemo(() => {
    if (!search.trim()) return tours
    const q = search.toLowerCase()
    return tours.filter((t) => {
      const address =
        t.orders?.property_address ||
        t.orders?.property?.address ||
        ''
      return address.toLowerCase().includes(q)
    })
  }, [tours, search])

  async function handleShare(tour: Tour) {
    const address =
      tour.orders?.property_address ||
      tour.orders?.property?.address ||
      'Property Tour'
    const url = `${window.location.origin}${getTourUrl(tour)}`

    if (navigator.share) {
      try {
        await navigator.share({ title: address, url })
      } catch (err) {
        // User cancelled sharing - not an error
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
      } catch {
        toast.error('Failed to copy link')
      }
    }
  }

  return (
    <div className="flex flex-col h-full font-alexandria">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm"
          />
        </div>
      </div>

      {/* Tour List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <TourCardSkeleton key={i} />)
        ) : filteredTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Globe className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-base">No tours found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try adjusting your search' : 'Your tours will appear here'}
            </p>
          </div>
        ) : (
          filteredTours.map((tour) => {
            const image = getFeaturedImage(tour)
            const address =
              tour.orders?.property_address ||
              tour.orders?.property?.address ||
              'Unknown Address'
            const status = getPropertyStatus(tour)
            const tourUrl = getTourUrl(tour)

            return (
              <Card key={tour.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Featured Image */}
                <div className="w-full h-[180px] bg-gray-100 relative">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{address}</p>

                  {status && (
                    <Badge className={`text-[10px] px-2 py-0 mt-1.5 ${getPropertyStatusColor(status)}`}>
                      {status}
                    </Badge>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 h-10 text-xs font-medium text-white rounded-lg"
                      style={{ backgroundColor: agentColor }}
                      onClick={() => window.open(tourUrl, '_blank')}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Tour
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-10 text-xs font-medium rounded-lg"
                      style={{ borderColor: agentColor, color: agentColor }}
                      onClick={() => handleShare(tour)}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
