-- Enable real-time for command_items and commands tables
ALTER TABLE public.command_items REPLICA IDENTITY FULL;
ALTER TABLE public.commands REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.command_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commands;