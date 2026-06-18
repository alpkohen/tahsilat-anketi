-- Tahsilat anketi — RLS politikaları (Supabase SQL Editor'da çalıştırın)
-- Önce mevcut politikalarınız varsa çakışma olabilir; gerekirse tablo bazında DROP POLICY ile temizleyin.
--
-- Özet:
-- • survey_groups: anon + authenticated SELECT (anket linki). INSERT/UPDATE/DELETE sadece authenticated (admin paneli).
-- • participants: anon + authenticated INSERT (anket akışı). SELECT sadece authenticated (admin).
-- • results: anon + authenticated INSERT (anket tamamlama). SELECT doğrudan sadece authenticated (admin);
--   anon sonuç ekranı için get_result_public(uuid) SECURITY DEFINER RPC kullanın.

ALTER TABLE survey_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- survey_groups
DROP POLICY IF EXISTS "survey_groups_select_anon" ON survey_groups;
DROP POLICY IF EXISTS "survey_groups_all_authenticated" ON survey_groups;

CREATE POLICY "survey_groups_select_anon"
  ON survey_groups FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "survey_groups_all_authenticated"
  ON survey_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- participants: insert herkese (anket), okuma sadece giriş yapmış
DROP POLICY IF EXISTS "participants_insert_public" ON participants;
DROP POLICY IF EXISTS "participants_select_authenticated" ON participants;

CREATE POLICY "participants_insert_public"
  ON participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "participants_select_authenticated"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

-- results: insert herkese, okuma admin
DROP POLICY IF EXISTS "results_insert_public" ON results;
DROP POLICY IF EXISTS "results_select_authenticated" ON results;

CREATE POLICY "results_insert_public"
  ON results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "results_select_authenticated"
  ON results FOR SELECT
  TO authenticated
  USING (true);

-- Katılımcı sonuç sayfası (/result/:id) anon anahtarla çalışır; doğrudan SELECT RLS nedeniyle reddedilir.
-- Bu fonksiyon yalnızca verilen UUID için tek kayıt döndürür (link = yetki varsayımı).
CREATE OR REPLACE FUNCTION public.get_result_public(p_result_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', r.id,
    'final_score', r.final_score,
    'group1_score', r.group1_score,
    'group2_score', r.group2_score,
    'profile', r.profile,
    'participants', jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name
    )
  )
  FROM results r
  INNER JOIN participants p ON p.id = r.participant_id
  WHERE r.id = p_result_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_result_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_result_public(uuid) TO anon, authenticated;
