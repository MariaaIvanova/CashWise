-- Restore the three removed lessons
INSERT INTO lessons (id, title, description, content, difficulty, xp_reward, order_index) VALUES
    ('5', 'Данък върху доходите на юридическите лица', 'Научете за ДДЮЛ, как се изчислява и какви са задълженията на фирмите.', 'ДДЮЛ е основен данък, който се прилага върху печалбата на компаниите в България. Той е важен за разбиране на бизнес финансите и задълженията на фирмите.

Основни характеристики на ДДЮЛ:
- Ставка от 10% върху облагаемата печалба
- Годишен данъчен период
- Декларация до 31 март следващата година
- Авансови вноски през годината

Как се изчислява:
1. Определяне на облагаемата печалба
   - Приходи минус разходи
   - Корекции според данъчното законодателство
2. Прилагане на ставката от 10%
3. Отчитане на данъчни облекчения
4. Изчисляване на финалното задължение', 'intermediate', 75, 5),

    ('6', 'Социално осигуряване', 'Научете за системата на социално осигуряване в България и вашите права.', 'Социалното осигуряване в България е система, която осигурява защита на гражданите при различни социални рискове. Тя включва здравно, пенсионно и осигуряване при безработица.

Основни компоненти:
1. Здравно осигуряване
   - Задължително за всички работещи
   - Покрива основното здравеопазване
   - Вноска от 8% от дохода

2. Пенсионно осигуряване
   - Първа пенсионна каса (8.8% от дохода)
   - Втора пенсионна каса (5% от дохода)
   - Трета пенсионна каса (доброволна)

3. Осигуряване при безработица
   - Задължително за работещите
   - Вноска от 1.2% от дохода
   - Право на обезщетение при загуба на работа', 'beginner', 50, 6),

    ('7', 'Спестяване и финансово планиране', 'Научете как да управлявате парите си разумно, да спестявате и да планирате финансовото си бъдеще.', 'Да спестяваш пари не означава да се лишаваш. Това означава да мислиш за бъдещето си. Дори малки суми всеки месец могат да направят голяма разлика след време. Финансовото планиране е като план за пътуване – казваш си къде искаш да стигнеш и как ще стигнеш до там.

Защо е важно да спестяваме?
- За спешни случаи (пример: неочакван разход за лекар)
- За по-големи цели (телефон, лаптоп, образование, кола)
- За спокойствие – знаеш, че имаш резерв

Как да започнем:
1. Определете целите си
2. Направете бюджет
3. Автоматизирайте спестяванията
4. Регулярно преглеждайте прогреса си', 'beginner', 50, 7)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    updated_at = timezone('utc'::text, now());

-- Create initial progress records for these lessons for all existing users
INSERT INTO user_progress (user_id, lesson_id)
SELECT p.id, l.id
FROM profiles p
CROSS JOIN lessons l
WHERE l.id IN ('5', '6', '7')
AND NOT EXISTS (
    SELECT 1 
    FROM user_progress up 
    WHERE up.user_id = p.id 
    AND up.lesson_id = l.id
);

-- Update the completed_lessons count for all profiles
DO $$
DECLARE
    v_profile RECORD;
    v_completed_count INTEGER;
BEGIN
    -- Loop through all profiles
    FOR v_profile IN SELECT id FROM profiles LOOP
        -- Count actual completed lessons for this profile
        SELECT COUNT(*) INTO v_completed_count
        FROM user_progress
        WHERE user_id = v_profile.id
        AND completed = true;

        -- Update the profile with the correct count
        UPDATE profiles
        SET completed_lessons = v_completed_count
        WHERE id = v_profile.id;
    END LOOP;
END $$; 