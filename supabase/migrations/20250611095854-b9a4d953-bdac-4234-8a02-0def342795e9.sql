
-- Create table to store SumUp transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_transaction_id TEXT NOT NULL UNIQUE,
  sumup_transaction_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL CHECK (status IN ('pending', 'successful', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  merchant_code TEXT NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  punch_force INTEGER,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT
);

-- Create table to track refund history
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  refund_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'successful', 'failed')),
  processed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_transactions_client_id ON public.transactions(client_transaction_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_refunds_transaction_id ON public.refunds(transaction_id);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (you can adjust these based on your auth setup)
CREATE POLICY "Admin can view all transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Admin can update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Admin can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view all refunds" ON public.refunds FOR SELECT USING (true);
CREATE POLICY "Admin can insert refunds" ON public.refunds FOR INSERT WITH CHECK (true);
