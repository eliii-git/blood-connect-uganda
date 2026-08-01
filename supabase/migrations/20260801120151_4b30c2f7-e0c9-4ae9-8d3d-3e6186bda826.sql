CREATE OR REPLACE FUNCTION public.enforce_facility_status_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can change facility approval status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hospitals_status_admin_only ON public.hospitals;
CREATE TRIGGER hospitals_status_admin_only
BEFORE UPDATE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION public.enforce_facility_status_admin_only();

DROP TRIGGER IF EXISTS blood_banks_status_admin_only ON public.blood_banks;
CREATE TRIGGER blood_banks_status_admin_only
BEFORE UPDATE ON public.blood_banks
FOR EACH ROW EXECUTE FUNCTION public.enforce_facility_status_admin_only();

REVOKE EXECUTE ON FUNCTION public.enforce_facility_status_admin_only() FROM PUBLIC, anon, authenticated;