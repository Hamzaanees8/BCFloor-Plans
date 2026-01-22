import { ChevronRight } from 'lucide-react';
import React from 'react';
import { useWhiteLabel } from '@/app/context/Whitelabel';

interface Steps {
    id: string;
    label: string;
}

interface OrderStepperProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
    steps: Steps[];
    canNavigateTo: (tab: string) => boolean;
    userType: string;
}

const OrderStepper = ({ currentTab, onTabChange, steps, canNavigateTo, userType }: OrderStepperProps) => {
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const activeIndex = steps.findIndex(step => step.id === currentTab);

    return (
        <div className="w-full flex items-center justify-between px-4 md:px-0">
            {steps.map((step, index) => {
                const isActive = step.id === currentTab;
                const isCompleted = index < activeIndex;
                const isNavigable = canNavigateTo(step.id);
                const isLast = index === steps.length - 1;

                let circleBg = 'bg-[#E4E4E4]';
                let circleText = 'text-[#666666]';
                let labelColor = 'text-[#666666]';

                let circleStyle = {};
                let labelStyle = {};

                if (isActive || isCompleted) {
                    circleBg = '';
                    circleText = 'text-white';
                    labelColor = '';
                    circleStyle = { backgroundColor: roleSettings.pageTabColor };
                    labelStyle = { color: roleSettings.pageTabColor };
                }

                // Override for inactive but navigable? 
                // Currently matching active/completed logic. 
                // If strictly active:
                if (!isActive && !isCompleted) {
                    circleBg = 'bg-[#E4E4E4]';
                    circleText = 'text-[#666666]';
                    labelColor = 'text-[#666666]';
                    circleStyle = {};
                    labelStyle = {};
                }

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={`flex flex-col md:flex-row items-center gap-2 cursor-pointer flex-1 justify-center ${!isNavigable ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => isNavigable && onTabChange(step.id)}
                        >
                            <div
                                className={`w-[24px] h-[24px] md:w-[32px] md:h-[32px] rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-colors ${circleBg} ${circleText}`}
                                style={circleStyle}
                            >
                                {index + 1}
                            </div>
                            <span
                                className={`text-[10px] md:text-sm font-bold uppercase transition-colors ${labelColor}`}
                                style={labelStyle}
                            >
                                {step.label}
                            </span>
                        </div>

                        {!isLast && (
                            <div className="flex items-center justify-center px-2">
                                <ChevronRight className="w-4 h-4 text-[#BBBBBB]" />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default OrderStepper;
