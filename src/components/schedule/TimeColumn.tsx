import { HOUR_LINE_HEIGHT } from "@/lib/utils";

interface TimeColumnProps {
  timeSlots: string[];
}

export const TimeColumn = ({ timeSlots }: TimeColumnProps) => {
  return (
    <div className="bg-background border-r border-border min-w-[80px]">
      {/* Header */}
      <div className="h-12 bg-muted border-b border-border flex items-center justify-center px-3">
        <span className="text-sm font-semibold text-muted-foreground">Horário</span>
      </div>
      
      {/* Time slots - each representing 1 hour */}
      <div className="relative">
        {timeSlots.map((timeSlot) => (
          <div 
            key={timeSlot}
            className="border-b border-border/30 flex items-start justify-start px-2 py-1"
            style={{ height: `${HOUR_LINE_HEIGHT}px` }}
          >
            <span className="text-sm font-medium text-muted-foreground">{timeSlot}</span>
          </div>
        ))}
      </div>
    </div>
  );
};