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
            className="h-10 border-b border-border/50 flex items-center justify-center px-3"
          >
            <span className="text-sm font-medium text-foreground">{timeSlot}</span>
          </div>
        ))}
      </div>
    </div>
  );
};