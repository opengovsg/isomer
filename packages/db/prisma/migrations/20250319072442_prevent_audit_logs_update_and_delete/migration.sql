-- This is a custom migration to block any UPDATE and DELETE operations on the
-- AuditLog table
CREATE OR REPLACE FUNCTION prevent_audit_logs_update_and_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Cannot update or delete rows in table "AuditLog"';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_logs_update_and_delete
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_update_and_delete();
