DROP POLICY "notif insert" ON public.notifications;
CREATE POLICY "notif insert" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(),'hospital')
  OR public.has_role(auth.uid(),'blood_bank')
  OR public.has_role(auth.uid(),'admin')
);

DROP POLICY "cp insert" ON public.chat_participants;
CREATE POLICY "cp insert" ON public.chat_participants FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND c.created_by = auth.uid())
);

DROP POLICY "audit insert" ON public.audit_logs;
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = actor_id);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;