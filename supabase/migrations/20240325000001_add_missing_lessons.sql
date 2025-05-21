-- Add missing lessons to the lessons table
INSERT INTO lessons (id, title, description, content, difficulty, xp_reward, order_index) VALUES
    ('8', 'Банкови депозити', 'Научете за различните видове банкови депозити, техните характеристики и лихвени проценти.', 'Банковите депозити са един от най-популярните начини за спестяване...', 'beginner', 50, 8),
    ('9', 'Методи за бюджетиране', 'Научете различни методи за управление на личните финанси и създаване на бюджет.', 'Бюджетирането е основен инструмент за управление на личните финанси...', 'beginner', 50, 9)
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
WHERE l.id IN ('8', '9')
AND NOT EXISTS (
    SELECT 1 
    FROM user_progress up 
    WHERE up.user_id = p.id 
    AND up.lesson_id = l.id
); 