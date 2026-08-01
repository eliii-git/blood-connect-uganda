REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
