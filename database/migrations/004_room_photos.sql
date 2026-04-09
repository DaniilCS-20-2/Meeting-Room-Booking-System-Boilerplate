ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';

UPDATE rooms SET photos = json_build_array(photo_url)::jsonb WHERE photo_url IS NOT NULL AND photo_url != '';
