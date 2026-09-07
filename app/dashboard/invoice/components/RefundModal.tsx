'use client'
import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RotateCcw } from 'lucide-react'
import { RefundInvoice } from '../invoice_api'
import { toast } from 'sonner'
import { useAppContext } from '@/app/context/AppContext'

type RefundModalProps = {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
    onSuccess: (updatedInvoice?: any) => void;
    defaultAmount?: number;
}

const RefundModal = ({ isOpen, onClose, invoice, onSuccess, defaultAmount }: RefundModalProps) => {
    const { userType } = useAppContext();
    const role = (userType as string) || 'admin';
    const [amount, setAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [revokeMediaAccess, setRevokeMediaAccess] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen && invoice) {
            const refundable = (parseFloat(invoice.paid_amount || 0) - parseFloat(invoice.refunded_amount || 0)).toFixed(2)
            if (defaultAmount !== undefined) {
                const safeDefault = Math.min(defaultAmount, parseFloat(refundable)).toFixed(2)
                setAmount(safeDefault)
            } else {
                setAmount(refundable)
            }
            setNotes('')
            setRevokeMediaAccess(true)
        }
    }, [isOpen, invoice, defaultAmount])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || isNaN(parseFloat(amount))) {
            toast.error('Please enter a valid amount')
            return
        }

        try {
            setSubmitting(true)
            const res = await RefundInvoice(invoice.uuid, amount, notes, revokeMediaAccess)
            if (res.success) {
                toast.success('Refund processed successfully')
                onSuccess(res.data)
                onClose()
            } else {
                toast.error(res.message || 'Refund failed')
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process refund')
        } finally {
            setSubmitting(false)
        }
    }

    if (!invoice) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto font-alexandria rounded-[8px] bg-white border border-[#BBBBBB] shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-orange-500" />
                        Process Refund
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Refund Amount (CAD)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            disabled={role !== 'admin'}
                        />
                        <p className="text-xs text-gray-500">
                            Maximum refundable: ${(parseFloat(invoice.paid_amount || 0) - parseFloat(invoice.refunded_amount || 0)).toFixed(2)}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Media Access</Label>
                        <div className="space-y-2 pt-1">
                            <label className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-md border transition-colors ${revokeMediaAccess ? 'border-orange-500 bg-orange-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="mediaAccess"
                                    className="mt-0.5 text-orange-500 focus:ring-orange-500 h-4 w-4"
                                    checked={revokeMediaAccess === true}
                                    onChange={() => setRevokeMediaAccess(true)}
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-gray-800 block">Revoke Media Access</span>
                                    <span className="text-gray-500">Revoke agent access to media files for refunded services.</span>
                                </div>
                            </label>
                            <label className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-md border transition-colors ${!revokeMediaAccess ? 'border-orange-500 bg-orange-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="mediaAccess"
                                    className="mt-0.5 text-orange-500 focus:ring-orange-500 h-4 w-4"
                                    checked={revokeMediaAccess === false}
                                    onChange={() => setRevokeMediaAccess(false)}
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-gray-800 block">Keep Media Access</span>
                                    <span className="text-gray-500">Agent retains access as a courtesy/discount.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for refund..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Confirm Refund'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default RefundModal
