-- Aramalar Tablosu
CREATE TABLE searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    query TEXT NOT NULL,
    location TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Tam metin arama için indeks
    CONSTRAINT searches_query_not_empty CHECK (query <> ''),
    CONSTRAINT searches_location_not_empty CHECK (location <> '')
);

-- Kaydedilen Firmalar Tablosu
CREATE TABLE saved_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    place_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    rating NUMERIC(3,1),
    reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Benzersiz kısıtlama: Aynı kullanıcı aynı firmayı birden fazla kez kaydedemez
    CONSTRAINT unique_user_place UNIQUE (user_id, place_id),
    CONSTRAINT saved_companies_name_not_empty CHECK (name <> '')
);

-- İndeksler
CREATE INDEX searches_user_id_idx ON searches (user_id);
CREATE INDEX searches_created_at_idx ON searches (created_at DESC);
CREATE INDEX saved_companies_user_id_idx ON saved_companies (user_id);
CREATE INDEX saved_companies_created_at_idx ON saved_companies (created_at DESC);

-- Row Level Security (RLS) Politikaları
-- Kullanıcılar sadece kendi verilerini görebilir ve düzenleyebilir

-- Aramalar tablosu için RLS
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY searches_select_policy ON searches 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY searches_insert_policy ON searches 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY searches_delete_policy ON searches 
    FOR DELETE USING (auth.uid() = user_id);

-- Kaydedilen Firmalar tablosu için RLS
ALTER TABLE saved_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_companies_select_policy ON saved_companies 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY saved_companies_insert_policy ON saved_companies 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY saved_companies_delete_policy ON saved_companies 
    FOR DELETE USING (auth.uid() = user_id); 