-- Admin CMS pass — ONE sample History course, to demonstrate the CMS end to
-- end and give the admin something real to edit immediately. Deliberately
-- small (one lesson, one mission) per "do not create a huge curriculum yet."
-- Every row here is ordinary editable data, not a fixture the app depends
-- on — an admin can freely rename, unpublish, or delete any of it from the
-- Content Management UI with no code change and no effect on the existing
-- hardcoded SQL campaign.

insert into public.courses (title, description, subject, status, display_order)
values (
  'היסטוריה — קורס לדוגמה',
  'קורס דוגמה שנוצר כדי להדגים את מערכת ניהול התוכן. ניתן לערוך, להוסיף שיעורים, או להחליף את התוכן הזה לגמרי מתוך פאנל הניהול.',
  'history',
  'active',
  1
);

insert into public.lessons (course_id, title, content, display_order, status)
select
  c.id,
  'שיעור לדוגמה: המצאת הכתב',
  'הכתב הראשון בעולם הומצא בשומר העתיקה (מסופוטמיה) לפני כ-5000 שנה, ושימש בתחילה לתיעוד עסקאות ומלאי. זהו תוכן לדוגמה — ניתן לערוך אותו בכל עת מתוך פאנל הניהול.',
  1,
  'active'
from public.courses c
where c.title = 'היסטוריה — קורס לדוגמה';

insert into public.missions (
  lesson_id, title, objective, instructions, task, answer_config, hint,
  guidance_level_1, guidance_level_2, guidance_level_3, display_order, status
)
select
  l.id,
  'משימה לדוגמה: מקור הכתב',
  'לזהות היכן הומצא הכתב הראשון בעולם.',
  'קראו את השיעור, ואז ענו על השאלה בתיבת הטקסט.',
  'באיזו תרבות עתיקה הומצא הכתב הראשון בעולם?',
  '{"type": "exact_text", "acceptedAnswers": ["שומר", "שומרים", "מסופוטמיה"]}'::jsonb,
  'התשובה מוזכרת במשפט הראשון של השיעור.',
  'שימו לב למשפט הראשון בשיעור — הוא מזכיר את שם התרבות ואת האזור שלה במפורש.',
  'חשבו על האזור שנקרא "בין הנהרות" בעולם העתיק.',
  'אילו אזור עתיק מתאר בדרך כלל את הראשון שהמציא כתב, על סמך מה שקראתם?',
  1,
  'active'
from public.lessons l
join public.courses c on c.id = l.course_id
where c.title = 'היסטוריה — קורס לדוגמה'
  and l.title = 'שיעור לדוגמה: המצאת הכתב';
