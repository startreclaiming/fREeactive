-- Document Vault: user-owned records (DocumentVault.tsx).

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
