-- 活動（運営工数）対応: case_idをnullableにし、activity_categoryを追加
-- case_id IS NOT NULL = 案件ワーク（従来通り）
-- case_id IS NULL = 活動（運営: SNS, 開発, 事務など）

ALTER TABLE progress_logs ALTER COLUMN case_id DROP NOT NULL;
ALTER TABLE progress_logs ADD COLUMN activity_category text;
