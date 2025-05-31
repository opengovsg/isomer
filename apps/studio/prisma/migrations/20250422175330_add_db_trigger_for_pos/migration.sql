-- NOTE: this is a custo migration to add a db trigger on
-- insertion of any `null` values into the `Resource`.`pos` row
CREATE OR REPLACE FUNCTION set_default_pos()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the parent resource is of type 'Folder'
    IF EXISTS (
        SELECT 1
        FROM "Resource"
        WHERE "id" = NEW."parentId"
        AND "type" = 'Folder'
    ) THEN
        -- If the pos is NULL, calculate the next available pos for this parentId
        IF NEW."pos" IS NULL THEN
            SELECT COALESCE(MAX("pos"), 0) + 1
            INTO NEW."pos"
            FROM "Resource"
            WHERE "parentId" = NEW."parentId";
        END IF;
    END IF;
    
    -- Return the modified row
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pos_default
BEFORE INSERT ON "Resource"
FOR EACH ROW
EXECUTE FUNCTION set_default_pos();
