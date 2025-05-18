import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Topic, VisualElement } from '../../../screens/LessonScreen';

export const corporateTaxTopics: Topic[] = [
  {
    title: 'Данък върху доходите на юридическите лица (ДДЮЛ)',
    content: `Данъкът върху доходите на юридическите лица (ДДЮЛ) е основен данък, който се прилага върху печалбата на компаниите в България. От 2007 г. България има единна ставка от 10%, което я прави привлекателна дестинация за бизнес.

ДДЮЛ се изчислява върху облагаемата печалба, която представлява разликата между приходите и разходите на компанията. Важно е да се отбележи, че не всички разходи са признати за данъчни цели, а някои са ограничени или изцяло изключени.

Компаниите са длъжни да подават месечни данъчни декларации и да плащат авансови вноски, а годишното данъчно приключване се извършва до 31 март на следващата година.`,
    videoAsset: 'lesson5',
    keyPoints: [
      'Единна ставка на ДДЮЛ: 10%',
      'Прилага се върху облагаемата печалба',
      'Месечни данъчни декларации и авансови вноски',
      'Годишно приключване до 31 март',
      'Възможност за данъчни облекчения и инвестиционни стимули'
    ],
    visualElements: [
      {
        type: 'table',
        title: 'Основни елементи на ДДЮЛ',
        headers: ['Елемент', 'Описание', 'Срок'],
        rows: [
          ['Авансови вноски', 'Месечни плащания', 'До 15-ия ден на следващия месец'],
          ['Годишно приключване', 'Финално изчисление', 'До 31 март'],
          ['Данъчна декларация', 'Годишен отчет', 'До 31 март'],
          ['Данъчна сметка', 'Финансов отчет', 'До 31 март']
        ]
      },
      {
        type: 'icons',
        title: 'Ключови аспекти на ДДЮЛ',
        items: [
          { icon: 'office-building', label: '10% ставка' },
          { icon: 'chart-line', label: 'Облагаема печалба' },
          { icon: 'calendar-clock', label: 'Месечни декларации' },
          { icon: 'cash-multiple', label: 'Авансови вноски' }
        ]
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  surface: {
    padding: 16,
    marginVertical: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  keyPoint: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 16,
  },
});

export default corporateTaxTopics; 