-- Chat level trigger: BOTH participants must individually meet message thresholds
-- Prevents one person from spamming to level up alone
--
-- Thresholds per participant:
--   L1: 0-2 messages each
--   L2: 3+ messages each  (need 3 from both)
--   L3: 9+ messages each  (need 9 from both)
--   L4: 21+ messages each (need 21 from both)
--   L5: 45+ messages each (need 45 from both, MAX)

CREATE OR REPLACE FUNCTION update_chat_level()
RETURNS TRIGGER AS $$
DECLARE
    oc1_id_var TEXT;
    oc2_id_var TEXT;
    count1 INTEGER;
    count2 INTEGER;
    min_count INTEGER;
    new_level INTEGER;
BEGIN
    -- Get the OC IDs for this chat session
    SELECT oc1_id, oc2_id INTO oc1_id_var, oc2_id_var
    FROM chat_sessions
    WHERE id = NEW.chat_id;

    -- Count messages sent by each OC individually
    SELECT COUNT(*) INTO count1
    FROM chat_messages
    WHERE chat_id = NEW.chat_id AND from_oc_id = oc1_id_var;

    SELECT COUNT(*) INTO count2
    FROM chat_messages
    WHERE chat_id = NEW.chat_id AND from_oc_id = oc2_id_var;

    -- Level is determined by the participant who has sent the FEWEST messages
    -- Both must participate equally to level up
    min_count := LEAST(count1, count2);

    new_level := CASE
        WHEN min_count >= 45 THEN 5
        WHEN min_count >= 21 THEN 4
        WHEN min_count >= 9  THEN 3
        WHEN min_count >= 3  THEN 2
        ELSE 1
    END;

    UPDATE chat_sessions
    SET chat_level = new_level
    WHERE id = NEW.chat_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trg_update_chat_level ON chat_messages;

-- Create trigger
CREATE TRIGGER trg_update_chat_level
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_level();

-- Recalculate all existing chat levels to apply the new rule
UPDATE chat_sessions cs
SET chat_level = (
    SELECT CASE
        WHEN LEAST(
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc1_id),
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc2_id)
        ) >= 45 THEN 5
        WHEN LEAST(
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc1_id),
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc2_id)
        ) >= 21 THEN 4
        WHEN LEAST(
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc1_id),
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc2_id)
        ) >= 9  THEN 3
        WHEN LEAST(
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc1_id),
            (SELECT COUNT(*) FROM chat_messages WHERE chat_id = cs.id AND from_oc_id = cs.oc2_id)
        ) >= 3  THEN 2
        ELSE 1
    END
);
