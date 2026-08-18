CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Untitled document',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_plain text NOT NULL DEFAULT '',
  template_used text,
  version integer NOT NULL DEFAULT 1,
  word_count integer NOT NULL DEFAULT 0,
  paper_size text NOT NULL DEFAULT 'a4',
  last_autosave timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents own read" ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "documents own insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "documents own update" ON public.documents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "documents own delete" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER documents_touch BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  version integer NOT NULL,
  word_count integer NOT NULL DEFAULT 0,
  saved_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions read own" ON public.document_versions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (d.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "versions insert own" ON public.document_versions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "versions delete own" ON public.document_versions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  content jsonb NOT NULL,
  paper_size text NOT NULL DEFAULT 'a4',
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.templates TO anon;
GRANT SELECT ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates public read" ON public.templates FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "templates staff manage" ON public.templates FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.templates (name, description, category, paper_size, content) VALUES
('Blank document','Start from an empty page.','general','a4','{"type":"doc","content":[{"type":"paragraph"}]}'),
('Business letter','Formal letter with sender, date and signature block.','letter','a4','{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Your Name"}]},{"type":"paragraph","content":[{"type":"text","text":"Nairobi, Kenya"}]},{"type":"paragraph"},{"type":"paragraph","content":[{"type":"text","text":"Dear Sir/Madam,"}]},{"type":"paragraph","content":[{"type":"text","text":"Write your message here."}]},{"type":"paragraph"},{"type":"paragraph","content":[{"type":"text","text":"Yours faithfully,"}]}]}'),
('Business card','Compact card layout with name, role and contacts.','card','a4','{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Your Name"}]},{"type":"paragraph","content":[{"type":"text","text":"Job title · Company"}]},{"type":"paragraph","content":[{"type":"text","text":"+254 700 000 000 · you@email.com"}]}]}'),
('Event flyer','Bold headline flyer with details and call to action.','flyer','a4','{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"EVENT TITLE"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Date · Time · Venue"}]},{"type":"paragraph","content":[{"type":"text","text":"Describe the event in one or two lines."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Highlight one"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Highlight two"}]}]}]}]}'),
('Poster','Large-format poster with headline and short body.','poster','a3','{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"HEADLINE"}]},{"type":"paragraph","content":[{"type":"text","text":"Supporting line goes here."}]}]}'),
('CV / Resume','Clean single-column CV with sections.','letter','a4','{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Your Name"}]},{"type":"paragraph","content":[{"type":"text","text":"Email · Phone · Nairobi"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Experience"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Role — Company (2023–now)"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Education"}]},{"type":"paragraph","content":[{"type":"text","text":"Institution, qualification"}]}]}');