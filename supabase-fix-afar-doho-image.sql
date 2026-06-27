update public.site_content sc
set payload = jsonb_set(
  sc.payload,
  '{trips}',
  (
    select coalesce(
      jsonb_agg(
        case
          when trip->>'category' = 'afar-doho-benuna'
            or lower(coalesce(trip->>'name', '')) like '%afar doho%'
          then jsonb_set(trip, '{image}', to_jsonb('assets/hikings/afar-doho-benuna.webp'::text), true)
          else trip
        end
        order by ord
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(sc.payload->'trips', '[]'::jsonb)) with ordinality as arr(trip, ord)
  ),
  true
)
where sc.id = 'main'
  and sc.payload ? 'trips';

update public.site_content sc
set payload = jsonb_set(
  sc.payload,
  '{galleryImages}',
  (
    select coalesce(
      jsonb_agg(
        case
          when fixed.image->>'category' = 'afar-doho-benuna'
            and fixed.category_rank = 1
          then jsonb_set(fixed.image, '{src}', to_jsonb('assets/gallery/afar-doho-benuna/afar-doho-benuna-01.jpg'::text), true)
          else fixed.image
        end
        order by fixed.ord
      ),
      '[]'::jsonb
    )
    from (
      select
        image,
        ord,
        row_number() over (partition by image->>'category' order by ord) as category_rank
      from jsonb_array_elements(coalesce(sc.payload->'galleryImages', '[]'::jsonb)) with ordinality as arr(image, ord)
    ) as fixed
  ),
  true
)
where sc.id = 'main'
  and sc.payload ? 'galleryImages';

update public.site_defaults sd
set payload = jsonb_set(
  sd.payload,
  '{trips}',
  (
    select coalesce(
      jsonb_agg(
        case
          when trip->>'category' = 'afar-doho-benuna'
            or lower(coalesce(trip->>'name', '')) like '%afar doho%'
          then jsonb_set(trip, '{image}', to_jsonb('assets/hikings/afar-doho-benuna.webp'::text), true)
          else trip
        end
        order by ord
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(sd.payload->'trips', '[]'::jsonb)) with ordinality as arr(trip, ord)
  ),
  true
)
where sd.id = 'main'
  and sd.payload ? 'trips';

update public.site_defaults sd
set payload = jsonb_set(
  sd.payload,
  '{galleryImages}',
  (
    select coalesce(
      jsonb_agg(
        case
          when fixed.image->>'category' = 'afar-doho-benuna'
            and fixed.category_rank = 1
          then jsonb_set(fixed.image, '{src}', to_jsonb('assets/gallery/afar-doho-benuna/afar-doho-benuna-01.jpg'::text), true)
          else fixed.image
        end
        order by fixed.ord
      ),
      '[]'::jsonb
    )
    from (
      select
        image,
        ord,
        row_number() over (partition by image->>'category' order by ord) as category_rank
      from jsonb_array_elements(coalesce(sd.payload->'galleryImages', '[]'::jsonb)) with ordinality as arr(image, ord)
    ) as fixed
  ),
  true
)
where sd.id = 'main'
  and sd.payload ? 'galleryImages';
