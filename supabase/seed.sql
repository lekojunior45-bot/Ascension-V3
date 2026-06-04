-- Migration des apprenants existants
insert into public.apprenants (token,pseudo,paye,status,type,date,module_actuel,badges,participation,quiz_scores,telephone,nom,prenom,device_fingerprint)
values
  ('DEMO_O4_aFzKQKmw','The Major',false,'demo','demo','29/04/2026',1,'{}',2,'{}',null,null,null,null),
  ('DEMO_57hPjMv3Nds','BOLO',false,'demo','demo','30/04/2026',1,'{}',3,'{}',null,null,null,'459fc510148b8023c267'),
  ('DEMO_YKkQ_OzHcDA','Anne BELA',false,'demo','pre_inscrit','30/04/2026',1,'{}',0,'{}','620252898','BELA','Anne','459fc510148b8023c267'),
  ('DEMO_8wPPeMi9GBs','Jean NTOLO',false,'demo','pre_inscrit','30/04/2026',1,'{}',0,'{}','659863241','NTOLO','Jean',null),
  ('DEMO_UgojOHqfJNA','Samurai',false,'demo','demo','30/04/2026',1,'{}',1,'{}',null,null,null,'459fc510148b8023c267'),
  ('PRE_9qWbgAef','Loic AZO',false,'demo','pre_inscrit','30/04/2026',1,'{}',0,'{}','698656589','AZO','Loic','459fc510148b8023c267'),
  ('PRE_15zBVXT7','Steve BELE',false,'demo','pre_inscrit','12/05/2026',1,'{}',0,'{}','685965745','BELE','Steve',null),
  ('DEMO_H6pECIYCm2M','BG',false,'demo','demo','12/05/2026',1,'{}',0,'{}',null,null,null,'decf14ef60390234965b')
on conflict (token) do nothing;
