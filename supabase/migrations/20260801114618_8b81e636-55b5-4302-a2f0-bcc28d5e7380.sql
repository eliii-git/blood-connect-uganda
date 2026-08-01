-- profiles
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "roles readable" ON public.user_roles;
CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- ratings
DROP POLICY IF EXISTS "ratings read" ON public.ratings;
CREATE POLICY "ratings read" ON public.ratings FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- emergency_requests
DROP POLICY IF EXISTS "emergencies readable" ON public.emergency_requests;
CREATE POLICY "emergencies readable" ON public.emergency_requests FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    status IN ('open','partially_fulfilled')
    AND (
      public.has_role(auth.uid(), 'donor'::app_role)
      OR public.has_role(auth.uid(), 'hospital'::app_role)
      OR public.has_role(auth.uid(), 'blood_bank'::app_role)
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.emergency_responses er
    WHERE er.request_id = emergency_requests.id AND er.responder_user_id = auth.uid()
  )
);

-- emergency_responses
DROP POLICY IF EXISTS "responses readable" ON public.emergency_responses;
CREATE POLICY "responses readable" ON public.emergency_responses FOR SELECT TO authenticated
USING (
  auth.uid() = responder_user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.emergency_requests r
    WHERE r.id = emergency_responses.request_id AND r.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.donors d
    WHERE d.id = emergency_responses.donor_id AND d.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.blood_banks b
    WHERE b.id = emergency_responses.blood_bank_id AND b.owner_id = auth.uid()
  )
);

-- internal trigger helper should not be directly callable
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
