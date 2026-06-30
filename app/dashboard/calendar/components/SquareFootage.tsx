import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Order } from '../../orders/page'
import { useAppContext } from '@/app/context/AppContext';
import { Area } from './OrderDetailView';
import { GetSquareFootageTitles, SquareFootageTitles, defaultTitles } from './SquareFootageSettings';

interface SquareFootageProps {
    currentOrder: Order | undefined;
}

/** Format a number with commas: 1741 → "1,741" */
function formatNumber(n: number): string {
    return n.toLocaleString('en-CA');
}

/**
 * Builds a plain-text representation of the square footage data.
 * Alignment is achieved with spaces so the text looks clean when
 * copied into any app (WhatsApp, Google Docs, Word, etc.).
 */
function buildSquareFootageText(
    address: string,
    areas: Area[],
    titles: SquareFootageTitles
): string {
    const SEPARATOR = '‾'.repeat(26);
    const SQ_FT = 'sq. ft.';

    const getCategory = (area: Area): 'Finished' | 'Subtotal' | 'Other' =>
        area.type as 'Finished' | 'Subtotal' | 'Other';

    const finishedAreas = areas.filter(a => getCategory(a) === 'Finished');
    const subtotalAreas = areas.filter(a => getCategory(a) === 'Subtotal');
    const otherAreas = areas.filter(a => getCategory(a) === 'Other');

    const calcTotal = (items: Area[]) =>
        items.reduce((sum, a) => sum + (a.footage || 0), 0);

    const finishedTotal = calcTotal(finishedAreas);
    const subtotalTotal = calcTotal(subtotalAreas);
    const otherTotal = calcTotal(otherAreas);
    const grandTotal = finishedTotal + subtotalTotal;

    /**
     * Build a section block. Labels are padded to `labelWidth` chars,
     * values are right-aligned to `valueWidth` chars.
     */
    const buildSection = (
        sectionTitle: string,
        items: Area[],
        total: number,
        totalLabel: string
    ): string => {
        const labels = [
            ...items.map(a => (a.custom_title || a.type) + ':'),
            totalLabel + ':',
        ];
        const labelWidth = Math.max(...labels.map(l => l.length)) + 2;

        const values = [
            ...items.map(a => formatNumber(a.footage || 0) + ' ' + SQ_FT),
            formatNumber(total) + ' ' + SQ_FT,
        ];
        const valueWidth = Math.max(...values.map(v => v.length));

        const lines: string[] = [];
        lines.push(sectionTitle);

        items.forEach(a => {
            const label = ((a.custom_title || a.type) + ':').padEnd(labelWidth);
            const value = (formatNumber(a.footage || 0) + ' ' + SQ_FT).padStart(valueWidth);
            lines.push(label + value);
        });

        lines.push(SEPARATOR);

        const totalLabelPadded = (totalLabel + ':').padEnd(labelWidth);
        const totalValuePadded = (formatNumber(total) + ' ' + SQ_FT).padStart(valueWidth);
        lines.push(totalLabelPadded + totalValuePadded);

        return lines.join('\n');
    };

    const parts: string[] = [];

    // Header
    parts.push(address);
    parts.push('');

    // Left column: Finished + Subtotal groups, then Grand Total
    if (finishedAreas.length > 0) {
        parts.push(buildSection(titles.finished, finishedAreas, finishedTotal, 'Total'));
        parts.push('');
    }

    if (subtotalAreas.length > 0) {
        parts.push(buildSection(titles.subtotal, subtotalAreas, subtotalTotal, 'Total'));
        parts.push('');
    }

    // Right column: Other areas
    if (otherAreas.length > 0) {
        parts.push(buildSection(titles.other, otherAreas, otherTotal, 'Total'));
        parts.push('');
    }

    if (finishedAreas.length > 0 || subtotalAreas.length > 0) {
        // Grand total line
        parts.push(SEPARATOR);
        const grandLabel = 'Grand Total:';
        const grandValue = formatNumber(grandTotal) + ' ' + SQ_FT;
        const width = Math.max(grandLabel.length + 2 + grandValue.length + 2, 32);
        parts.push(grandLabel.padEnd(width - grandValue.length) + grandValue);
        parts.push('');
    }

    return parts.join('\n');
}

function SquareFootage({ currentOrder }: SquareFootageProps) {
    const { userType } = useAppContext();
    const [copied, setCopied] = useState(false);
    const [titles, setTitles] = useState<SquareFootageTitles>(defaultTitles);
    const areas = useMemo(() => currentOrder?.areas || [], [currentOrder?.areas]);

    useEffect(() => {
        GetSquareFootageTitles().then(setTitles);
    }, []);

    const isCalculated = areas.length > 0;

    /** Plain-text copy-ready string, rebuilt only when data changes */
    const formattedText = useMemo(() => {
        if (!isCalculated) return '';
        const address = [currentOrder?.property_address, currentOrder?.property_location]
            .filter(Boolean)
            .join(', ');
        return buildSquareFootageText(address, areas, titles);
    }, [areas, titles, currentOrder?.property_address, currentOrder?.property_location, isCalculated]);

    const handleCopy = useCallback(() => {
        if (!formattedText) return;
        navigator.clipboard.writeText(formattedText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [formattedText]);

    return (
        <div
            className="p-4 rounded border border-gray-300 text-[14px] text-[#666666] font-alexandria"
            style={{ backgroundColor: `var(--${userType}-page-bg, #F5F5F5)` }}
        >

            {!isCalculated ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#7D7D7D]">
                    <p className="text-[15px] italic">Square footage has not been calculated/uploaded yet.</p>
                </div>
            ) : (
                <>
                    {/* Old visual HTML grid — commented out, replaced by the textarea below */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {renderSection(titles.finished, finishedAreas, finishedTotal)}
                            {renderSection(titles.subtotal, subtotalAreas, subtotalTotal)}
                            <div className="border-t border-gray-300 !mt-6 !mb-4"></div>
                            <div className="flex justify-between text-[16px]">
                                <strong>Grand Total:</strong>
                                <strong>{grandTotal} sqft</strong>
                            </div>
                        </div>
                        <div>
                            {renderSection(titles.other, otherAreas, otherTotal)}
                        </div>
                    </div> */}

                    {/* Plain-text textarea — primary display */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={handleCopy}
                            title="Copy to clipboard"
                            style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontFamily: 'Alexandria, sans-serif',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: copied ? '#6BAE41' : '#D0D0D0',
                                background: copied ? '#f0fae8' : 'white',
                                color: copied ? '#6BAE41' : '#7D7D7D',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                zIndex: 1,
                            }}
                        >
                            {copied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                        <div
                            style={{
                                width: '100%',
                                fontFamily: 'Alexandria, sans-serif',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: 'inherit',
                                cursor: 'text',
                                whiteSpace: 'pre',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                padding: '0',
                                paddingTop: '32px',
                                userSelect: 'text',
                            }}
                        >
                            <strong>{formattedText.split('\n')[0]}</strong>
                            {'\n'}
                            {formattedText.split('\n').slice(1).join('\n')}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default SquareFootage