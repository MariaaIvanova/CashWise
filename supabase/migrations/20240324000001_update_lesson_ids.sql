-- Update lesson IDs to match the app's IDs
UPDATE lessons
SET id = CASE 
    WHEN title = 'ДДС в България' THEN '1'
    WHEN title = 'Какво означава да инвестираш?' THEN '2'
    WHEN title = 'Данък върху доходите на физическите лица' THEN '3'
    WHEN title = 'Данък върху доходите на юридическите лица' THEN '5'
    WHEN title = 'Социално осигуряване' THEN '6'
    ELSE id
END
WHERE title IN (
    'ДДС в България',
    'Какво означава да инвестираш?',
    'Данък върху доходите на физическите лица',
    'Данък върху доходите на юридическите лица',
    'Социално осигуряване'
);

-- Insert any missing lessons
INSERT INTO lessons (id, title, description, content, difficulty, xp_reward, order_index)
SELECT 
    id,
    title,
    description,
    content,
    'beginner' as difficulty,
    50 as xp_reward,
    CASE id
        WHEN '1' THEN 1
        WHEN '2' THEN 2
        WHEN '3' THEN 3
        WHEN '5' THEN 4
        WHEN '6' THEN 5
    END as order_index
FROM (
    VALUES 
        ('1', 'ДДС в България', 'Научете за данъка върху добавената стойност, кога се прилага и какви са ставките.', 'ДДС е косвен данък, който се начислява върху почти всички стоки и услуги в България...'),
        ('2', 'Какво означава да инвестираш?', 'Научете за основните видове инвестиции и как да започнете да инвестирате разумно.', 'Инвестирането е процес на разполагане с пари с цел получаване на доход или печалба в бъдеще...'),
        ('3', 'Данък върху доходите на физическите лица', 'Научете за ДДФЛ, как се изчислява и кога трябва да плащате.', 'ДДФЛ е основен директ данък, който се прилага върху доходите на физическите лица в България...'),
        ('5', 'Данък върху доходите на юридическите лица', 'Научете за ДДЮЛ, как се изчислява и какви са задълженията на фирмите.', 'ДДЮЛ е основен данък, който се прилага върху печалбата на компаниите в България...'),
        ('6', 'Социално осигуряване', 'Научете за системата на социално осигуряване в България и вашите права.', 'Социалното осигуряване в България е система, която осигурява защита на гражданите при различни социални рискове...')
) AS new_lessons(id, title, description, content)
WHERE NOT EXISTS (
    SELECT 1 FROM lessons WHERE id = new_lessons.id
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    updated_at = CURRENT_TIMESTAMP; 