-- Auto-update chat_level based on message count per session
-- Level thresholds:
--   L1: 0-2 messages
--   L2: 3-8 messages  (need 3 from L1)
--   L3: 9-20 messages (need 6 from L2)
--   L4: 21-44 messages (need 12 from L3)
--   L5: 45+ messages   (need 24 from L4, MAX)

CREATE OR REPLACE FUNCTION update_chat_level()
RETURNS TRIGGER AS $$
DECLARE
    msg_count INTEGER;
    new_level INTEGER;
BEGIN
    SELECT COUNT(*) INTO msg_count
    FROM chat_messages
    WHERE chat_id = NEW.chat_id;

    new_level := CASE
        WHEN msg_count >= 45 THEN 5
        WHEN msg_count >= 21 THEN 4
        WHEN msg_count >= 9  THEN 3
        WHEN msg_count >= 3  THEN 2
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
