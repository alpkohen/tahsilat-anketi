-- Tahsilat anketi — RLS politikaları (Supabase SQL Editor'da çalıştırın)
-- Önce mevcut politikalarınız varsa çakışma olabilir; gerekirse tablo bazında DROP POLICY ile temizleyin.
--
-- Özet:
-- • survey_groups: anon + authenticated SELECT (anket linki). INSERT/UPDATE/DELETE sadece authenticated (admin paneli).
-- • participants: anon + authenticated INSERT (anket akışı). SELECT sadece authenticated (admin).
-- • results: anon + authenticated INSERT (anket tamamlama). SELECT sadece authenticated (admin).

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
