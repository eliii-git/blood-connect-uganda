-- ENUMS
CREATE TYPE public.app_role AS ENUM ('donor','hospital','blood_bank','admin');
CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected','suspended');
CREATE TYPE public.blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE public.urgency_level AS ENUM ('low','moderate','high','critical');
CREATE TYPE public.request_status AS ENUM ('open','partially_fulfilled','fulfilled','cancelled','expired');
CREATE TYPE public.response_status AS ENUM ('pending','accepted','declined','completed');
CREATE TYPE public.appointment_status AS ENUM ('scheduled','completed','cancelled','rescheduled','rejected','approved');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  district text DEFAULT 'Kampala',
  city text DEFAULT 'Kampala',
  country text NOT NULL DEFAULT 'Uganda',
  avatar_url text,
  national_id_url text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete profile" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- HOSPITALS
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  district text NOT NULL DEFAULT 'Kampala',
  city text NOT NULL DEFAULT 'Kampala',
  address text,
  phone text,
  email text,
  latitude double precision,
  longitude double precision,
  license_url text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitals TO authenticated;
GRANT SELECT ON public.hospitals TO anon;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospitals public read" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "hospital owner insert" ON public.hospitals FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "hospital owner update" ON public.hospitals FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "hospital admin delete" ON public.hospitals FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER hospitals_updated BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOOD BANKS
CREATE TABLE public.blood_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  district text NOT NULL DEFAULT 'Kampala',
  city text NOT NULL DEFAULT 'Kampala',
  address text,
  phone text,
  email text,
  latitude double precision,
  longitude double precision,
  license_url text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_banks TO authenticated;
GRANT SELECT ON public.blood_banks TO anon;
GRANT ALL ON public.blood_banks TO service_role;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banks public read" ON public.blood_banks FOR SELECT USING (true);
CREATE POLICY "bank owner insert" ON public.blood_banks FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "bank owner update" ON public.blood_banks FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bank admin delete" ON public.blood_banks FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER banks_updated BEFORE UPDATE ON public.blood_banks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONORS
CREATE TABLE public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  blood_type public.blood_type NOT NULL,
  district text NOT NULL DEFAULT 'Kampala',
  city text NOT NULL DEFAULT 'Kampala',
  latitude double precision,
  longitude double precision,
  is_available boolean NOT NULL DEFAULT true,
  last_donation_date date,
  total_donations integer NOT NULL DEFAULT 0,
  lives_saved integer NOT NULL DEFAULT 0,
  weight_kg numeric,
  health_notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donors TO authenticated;
GRANT ALL ON public.donors TO service_role;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donors readable to staff" ON public.donors FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public.has_role(auth.uid(),'hospital') OR public.has_role(auth.uid(),'blood_bank') OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "donor self insert" ON public.donors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "donor self update" ON public.donors FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "donor delete" ON public.donors FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER donors_updated BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOOD INVENTORY
CREATE TABLE public.blood_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_bank_id uuid NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
  blood_type public.blood_type NOT NULL,
  units integer NOT NULL DEFAULT 0,
  expiry_date date,
  batch_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_inventory TO authenticated;
GRANT SELECT ON public.blood_inventory TO anon;
GRANT ALL ON public.blood_inventory TO service_role;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory read" ON public.blood_inventory FOR SELECT USING (true);
CREATE POLICY "inventory owner write" ON public.blood_inventory FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.blood_banks b WHERE b.id = blood_bank_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.blood_banks b WHERE b.id = blood_bank_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE TRIGGER inventory_updated BEFORE UPDATE ON public.blood_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EMERGENCY REQUESTS
CREATE TABLE public.emergency_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  blood_type public.blood_type NOT NULL,
  units_needed integer NOT NULL DEFAULT 1,
  units_received integer NOT NULL DEFAULT 0,
  patient_condition text,
  urgency public.urgency_level NOT NULL DEFAULT 'high',
  notes text,
  status public.request_status NOT NULL DEFAULT 'open',
  needed_by timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_requests TO authenticated;
GRANT ALL ON public.emergency_requests TO service_role;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergencies readable" ON public.emergency_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "hospital create emergency" ON public.emergency_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND public.has_role(auth.uid(),'hospital'));
CREATE POLICY "hospital update emergency" ON public.emergency_requests FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "hospital delete emergency" ON public.emergency_requests FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER emergencies_updated BEFORE UPDATE ON public.emergency_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EMERGENCY RESPONSES
CREATE TABLE public.emergency_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES public.donors(id) ON DELETE CASCADE,
  blood_bank_id uuid REFERENCES public.blood_banks(id) ON DELETE CASCADE,
  responder_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.response_status NOT NULL DEFAULT 'pending',
  eta_minutes integer,
  match_score integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_responses TO authenticated;
GRANT ALL ON public.emergency_responses TO service_role;
ALTER TABLE public.emergency_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses readable" ON public.emergency_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "responses insert" ON public.emergency_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = responder_user_id);
CREATE POLICY "responses update" ON public.emergency_responses FOR UPDATE TO authenticated USING (
  auth.uid() = responder_user_id OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.emergency_requests r WHERE r.id = request_id AND r.created_by = auth.uid())
);
CREATE TRIGGER responses_updated BEFORE UPDATE ON public.emergency_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.donors(id) ON DELETE CASCADE,
  donor_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  blood_bank_id uuid REFERENCES public.blood_banks(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments read" ON public.appointments FOR SELECT TO authenticated USING (
  auth.uid() = donor_user_id OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.hospitals h WHERE h.id = hospital_id AND h.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.blood_banks b WHERE b.id = blood_bank_id AND b.owner_id = auth.uid())
);
CREATE POLICY "appointments insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_user_id);
CREATE POLICY "appointments update" ON public.appointments FOR UPDATE TO authenticated USING (
  auth.uid() = donor_user_id OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.hospitals h WHERE h.id = hospital_id AND h.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.blood_banks b WHERE b.id = blood_bank_id AND b.owner_id = auth.uid())
);
CREATE POLICY "appointments delete" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = donor_user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif update own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif delete own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CHATS
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.chat_participants (
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (chat_id, user_id)
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.chats, public.chat_participants, public.messages TO service_role;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_participant(_chat_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = _chat_id AND user_id = _user_id);
$$;

CREATE POLICY "chats read" ON public.chats FOR SELECT TO authenticated USING (public.is_chat_participant(id, auth.uid()));
CREATE POLICY "chats insert" ON public.chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "cp read" ON public.chat_participants FOR SELECT TO authenticated USING (public.is_chat_participant(chat_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "cp insert" ON public.chat_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "msg read" ON public.messages FOR SELECT TO authenticated USING (public.is_chat_participant(chat_id, auth.uid()));
CREATE POLICY "msg insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.is_chat_participant(chat_id, auth.uid()));
CREATE POLICY "msg update" ON public.messages FOR UPDATE TO authenticated USING (public.is_chat_participant(chat_id, auth.uid()));

-- RATINGS / BOOKMARKS / AUDIT
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings read" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ratings write" ON public.ratings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks own" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_inventory;

-- SEED: Ugandan hospitals
INSERT INTO public.hospitals (name, district, city, address, phone, email, latitude, longitude, status) VALUES
('Mulago National Referral Hospital','Kampala','Kampala','Mulago Hill Road','+256414554008','info@mulago.go.ug',0.3376,32.5763,'approved'),
('Nsambya Hospital','Kampala','Kampala','Nsambya Hill','+256414267012','care@nsambya.ug',0.2967,32.5875,'approved'),
('Mengo Hospital','Kampala','Kampala','Albert Cook Road','+256414270222','info@mengo.ug',0.3010,32.5620,'approved'),
('Entebbe Regional Referral Hospital','Wakiso','Entebbe','Portal Road','+256414320165','entebbe@health.go.ug',0.0512,32.4637,'approved'),
('Jinja Regional Referral Hospital','Jinja','Jinja','Nalufenya','+256434121103','jinja@health.go.ug',0.4478,33.2026,'approved'),
('Mbarara Regional Referral Hospital','Mbarara','Mbarara','Kakoba','+256485420785','mbarara@health.go.ug',-0.6072,30.6545,'approved'),
('Gulu Regional Referral Hospital','Gulu','Gulu','Laroo Division','+256471432134','gulu@health.go.ug',2.7746,32.2990,'approved'),
('Mbale Regional Referral Hospital','Mbale','Mbale','Pallisa Road','+256454433205','mbale@health.go.ug',1.0806,34.1755,'approved'),
('Arua Regional Referral Hospital','Arua','Arua','Hospital Road','+256476420112','arua@health.go.ug',3.0201,30.9110,'approved'),
('Masaka Regional Referral Hospital','Masaka','Masaka','Kitovu Road','+256481420159','masaka@health.go.ug',-0.3410,31.7360,'approved'),
('Fort Portal Regional Referral Hospital','Kabarole','Fort Portal','Buhinga','+256483422080','fortportal@health.go.ug',0.6540,30.2750,'approved'),
('Lira Regional Referral Hospital','Lira','Lira','Obote Avenue','+256473420098','lira@health.go.ug',2.2350,32.9100,'approved'),
('Soroti Regional Referral Hospital','Soroti','Soroti','Gweri Road','+256454461201','soroti@health.go.ug',1.7150,33.6110,'approved'),
('Hoima Regional Referral Hospital','Hoima','Hoima','Fort Portal Road','+256465440108','hoima@health.go.ug',1.4330,31.3520,'approved'),
('Kabale Regional Referral Hospital','Kabale','Kabale','Makanga Hill','+256486422135','kabale@health.go.ug',-1.2410,29.9890,'approved'),
('Mukono General Hospital','Mukono','Mukono','Kampala-Jinja Highway','+256414290110','mukono@health.go.ug',0.3536,32.7554,'pending');

-- SEED: Blood banks
INSERT INTO public.blood_banks (name, district, city, address, phone, email, latitude, longitude, status) VALUES
('Uganda Blood Transfusion Service - Nakasero','Kampala','Kampala','Plot 1 Nakasero Hill','+256414230272','nakasero@ubts.go.ug',0.3200,32.5800,'approved'),
('UBTS Regional Blood Bank - Jinja','Jinja','Jinja','Main Street','+256434120990','jinja@ubts.go.ug',0.4390,33.2050,'approved'),
('UBTS Regional Blood Bank - Mbarara','Mbarara','Mbarara','High Street','+256485421900','mbarara@ubts.go.ug',-0.6100,30.6580,'approved'),
('UBTS Regional Blood Bank - Gulu','Gulu','Gulu','Coronation Road','+256471433010','gulu@ubts.go.ug',2.7700,32.3000,'approved'),
('UBTS Regional Blood Bank - Mbale','Mbale','Mbale','Republic Street','+256454434400','mbale@ubts.go.ug',1.0820,34.1790,'approved'),
('UBTS Regional Blood Bank - Arua','Arua','Arua','Avenue Road','+256476421400','arua@ubts.go.ug',3.0230,30.9130,'approved'),
('UBTS Regional Blood Bank - Fort Portal','Kabarole','Fort Portal','Rukidi III Street','+256483423300','fortportal@ubts.go.ug',0.6570,30.2790,'approved'),
('UBTS Satellite Bank - Masaka','Masaka','Masaka','Elgin Street','+256481421700','masaka@ubts.go.ug',-0.3440,31.7390,'approved');

-- SEED: Inventory for every bank and blood type
INSERT INTO public.blood_inventory (blood_bank_id, blood_type, units, expiry_date, batch_code)
SELECT b.id, t.bt, (10 + (abs(hashtext(b.name || t.bt::text)) % 45)),
       current_date + ((abs(hashtext(b.id::text || t.bt::text)) % 40) + 5),
       'UG-' || upper(substr(md5(b.id::text || t.bt::text),1,6))
FROM public.blood_banks b
CROSS JOIN (SELECT unnest(enum_range(NULL::public.blood_type)) AS bt) t;

-- SEED: Donors (unclaimed demo donors across Uganda)
INSERT INTO public.donors (full_name, phone, blood_type, district, city, latitude, longitude, is_available, last_donation_date, total_donations, lives_saved, status) VALUES
('Namukasa Sarah','+256772104556','O-','Kampala','Kampala',0.3150,32.5810,true,'2026-04-12',9,27,'approved'),
('Okello Brian','+256701223344','O+','Gulu','Gulu',2.7720,32.2980,true,'2026-05-02',5,15,'approved'),
('Nabirye Grace','+256782445566','A+','Jinja','Jinja',0.4400,33.2010,true,'2026-03-18',12,36,'approved'),
('Mugisha Denis','+256752778899','B+','Mbarara','Mbarara',-0.6090,30.6560,false,'2026-06-30',3,9,'approved'),
('Akello Winnie','+256772990011','AB+','Lira','Lira',2.2340,32.9110,true,'2026-02-08',7,21,'approved'),
('Ssemakula Peter','+256703112233','O-','Wakiso','Entebbe',0.0530,32.4650,true,'2026-01-25',15,45,'approved'),
('Kirabo Diana','+256781556677','A-','Kampala','Kampala',0.3300,32.5700,true,'2026-05-19',4,12,'approved'),
('Tumusiime Alex','+256772334455','B-','Kabale','Kabale',-1.2400,29.9900,true,'2026-04-01',6,18,'approved'),
('Nakato Esther','+256759887766','AB-','Mukono','Mukono',0.3540,32.7560,true,'2026-06-11',2,6,'approved'),
('Wanyama Joseph','+256704665544','O+','Mbale','Mbale',1.0810,34.1770,true,'2026-03-05',11,33,'approved'),
('Achan Mercy','+256772119988','A+','Arua','Arua',3.0210,30.9120,false,'2026-07-01',8,24,'approved'),
('Byaruhanga Ivan','+256788223311','B+','Hoima','Hoima',1.4340,31.3510,true,'2026-02-27',5,15,'approved'),
('Nalubega Ritah','+256701447788','O+','Masaka','Masaka',-0.3420,31.7370,true,'2026-05-30',10,30,'approved'),
('Opio Samuel','+256772665511','O-','Soroti','Soroti',1.7140,33.6120,true,'2026-04-22',6,18,'approved'),
('Kemigisha Joan','+256753221100','A+','Kabarole','Fort Portal',0.6550,30.2760,true,'2026-06-02',3,9,'approved');

-- SEED: Emergency requests
INSERT INTO public.emergency_requests (hospital_id, blood_type, units_needed, patient_condition, urgency, notes, status, needed_by)
SELECT h.id,'O-',4,'Postpartum haemorrhage in maternity ward','critical','Patient in theatre, transfusion required immediately.','open', now() + interval '3 hours'
FROM public.hospitals h WHERE h.name='Mulago National Referral Hospital';
INSERT INTO public.emergency_requests (hospital_id, blood_type, units_needed, patient_condition, urgency, notes, status, needed_by)
SELECT h.id,'A+',2,'Road traffic accident on Jinja-Kampala highway','high','Two casualties admitted in casualty ward.','open', now() + interval '8 hours'
FROM public.hospitals h WHERE h.name='Jinja Regional Referral Hospital';
INSERT INTO public.emergency_requests (hospital_id, blood_type, units_needed, patient_condition, urgency, notes, status, needed_by)
SELECT h.id,'B+',3,'Severe malaria anaemia, paediatric ward','high','Child aged 6, haemoglobin 4g/dL.','open', now() + interval '12 hours'
FROM public.hospitals h WHERE h.name='Mbarara Regional Referral Hospital';
INSERT INTO public.emergency_requests (hospital_id, blood_type, units_needed, patient_condition, urgency, notes, status, needed_by)
SELECT h.id,'O+',6,'Sickle cell crisis, multiple patients','moderate','Scheduled transfusions for tomorrow morning.','open', now() + interval '20 hours'
FROM public.hospitals h WHERE h.name='Gulu Regional Referral Hospital';