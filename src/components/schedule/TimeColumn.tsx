import { SLOT_HEIGHT_PX } from "@/lib/utils";

interface TimeColumnProps {
  timeSlots: string[];
}

export const TimeColumn = ({ timeSlots }: TimeColumnProps) => {
  return (
    <div className="bg-background border-r border-border">
      {/* Header */}
      <div className="h-12 bg-muted border-b border-border flex items-center justify-center px-3">
        <span className="text-sm font-semibold text-muted-foreground">Horário</span>
      </div>
      
      {/* Time slots */}
      <div className="space-y-0">
        {timeSlots.map((timeSlot) => (
          <div 
            key={timeSlot}
            className="border-b border-border/50 flex items-center justify-center px-3"
            style={{ height: `${SLOT_HEIGHT_PX}px` }}
          >
            <span className="text-sm font-medium text-foreground">{timeSlot}</span>
          </div>
        ))}
      </div>
    </div>
  );
};