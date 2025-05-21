-- Add the saving and financial planning lesson back to the lessons table
INSERT INTO lessons (id, title, description, content, difficulty, xp_reward, order_index) VALUES
    ('7', 'Спестяване и финансово планиране', 'Научете как да управлявате парите си разумно, да спестявате и да планирате финансовото си бъдеще.', 'Да спестяваш пари не означава да се лишаваш. Това означава да мислиш за бъдещето си. Дори малки суми всеки месец могат да направят голяма разлика след време. Финансовото планиране е като план за пътуване – казваш си къде искаш да стигнеш и как ще стигнеш до там.

Защо е важно да спестяваме?

За спешни случаи (пример: неочакван разход за лекар)
За по-големи цели (телефон, лаптоп, образование, кола)
За спокойствие – знаеш, че имаш резерв', 'beginner', 50, 7)
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
WHERE l.id = '7'
AND NOT EXISTS (
    SELECT 1 
    FROM user_progress up 
    WHERE up.user_id = p.id 
    AND up.lesson_id = l.id
); 