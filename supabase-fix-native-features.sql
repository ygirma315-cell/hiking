-- Fix Native Day & Overnight package features (correct Amharic text)
-- Run this in Supabase SQL Editor after the schema is set up.

-- Fix Native Day features
UPDATE public.site_content
SET payload = jsonb_set(
  payload,
  '{packages,nativeDay,features}',
  '[
    "ትራንስፖርት ቱሪስት ስታንዳርድ (ኮስተር ባስ)",
    "ቁርስ እና ምሳ",
    "የታሸገ ውሃ",
    "ድንሽ (ክፍል)",
    "የፓርክ የመግቢያ ዋጋ",
    "አስጎብኚ",
    "የፓርክ ጠባቂ",
    "ፎቶግራፍ",
    "የተለያዩ ጨዋታዎች እና ሽልማቶች"
  ]'::jsonb
)
WHERE id = 'main';

-- Fix Native Overnight features
UPDATE public.site_content
SET payload = jsonb_set(
  payload,
  '{packages,nativeOvernight,features}',
  '[
    "ትራንስፖርት ቱሪስት ስታንዳርድ (ኮስተር ባስ)",
    "ቁርስ፣ ምሳ፣ እራት፣ ቁርስ፣ ምሳ",
    "የካምፕ ምሽት (የፍዩል ጥብስ)",
    "የታሸገ ውሃ",
    "ድንሽ (ክፍል)",
    "የፓርክ የመግቢያ ዋጋ",
    "አስጎብኚ",
    "የፓርክ ጠባቂ",
    "ፎቶግራፍ",
    "የተለያዩ ጨዋታዎች እና ሽልማቶች"
  ]'::jsonb
)
WHERE id = 'main';
