-- Add the financial goals lesson to the lessons table
INSERT INTO lessons (id, title, description, content, difficulty, xp_reward, order_index) VALUES
    ('10', 'Финансови цели и планиране', 'Научете как да си поставяте финансови цели и да планирате постигането им.', 'Поставянето на финансови цели е първата стъпка към финансов успех. Ето как да го направите:

1. Определете конкретни цели
Вместо "искам да спестя пари", кажете "искам да спестя 5000 лв. за нова кола до края на годината".

2. Разделете целите на краткосрочни и дългосрочни
Краткосрочни: до 1 година (спестяване за почивка)
Дългосрочни: над 1 година (пенсия, имот)

3. Направете план
Колко трябва да спестявате месечно?
Какви разходи можете да намалите?
Къде ще държите спестяванията?

4. Проследявайте прогреса
Проверявайте редовно дали сте на път да постигнете целите си
Празнувайте малките успехи
Коригирайте плана при нужда

5. Бъдете реалистични
Поставяйте постижими цели
Вземайте предвид доходите и разходите си
Планирайте за непредвидени ситуации', 'beginner', 50, 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    order_index = EXCLUDED.order_index,
    updated_at = timezone('utc'::text, now());

-- Create initial progress records for this lesson for all existing users
INSERT INTO user_progress (user_id, lesson_id)
SELECT p.id, l.id
FROM profiles p
CROSS JOIN lessons l
WHERE l.id = '10'
AND NOT EXISTS (
    SELECT 1 
    FROM user_progress up 
    WHERE up.user_id = p.id 
    AND up.lesson_id = l.id
); 