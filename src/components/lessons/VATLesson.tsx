import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Topic, VisualElement } from '../../../screens/LessonScreen';

export const vatLessonTopics: Topic[] = [
  {
    title: 'ДДС в България – кога се прилага и какви са ставките',
    content: `Данъкът върху добавената стойност (ДДС) е косвен данък, който се начислява върху почти всички стоки и услуги в България. В момента основната ставка е 20%, като за някои стоки, като книги и ресторантьорски услуги, има намалена ставка от 9%.

Когато пазаруваш в магазин, цената, която плащаш, вече включва ДДС. За фирмите, които надвишават определен годишен оборот (100 000 лв. от 2024 г.), регистрацията по ДДС е задължителна.

Въпреки че потребителят го плаща на касата, ДДС реално се отчита и превежда към държавата от фирмата-продавач. Тази система позволява прозрачност и контрол върху икономическите потоци.`,
    videoAsset: 'lesson3',
    keyPoints: [
      'Основна ставка на ДДС: 20%',
      'Намалена ставка: 9% (за книги и ресторантьорски услуги)',
      'Задължителна регистрация за фирми с оборот над 100 000 лв. от 2024 г.',
      'ДДС се включва в крайната цена на стоките и услугите',
      'Фирмите отчитат и превеждат ДДС към държавата'
    ],
    visualElements: [
      {
        type: 'table',
        title: 'ДДС ставки в България',
        headers: ['Категория', 'Ставка', 'Примери'],
        rows: [
          ['Основна ставка', '20%', 'Повечето стоки и услуги'],
          ['Намалена ставка', '9%', 'Книги, ресторантьорски услуги'],
          ['Нулева ставка', '0%', 'Износ на стоки и услуги']
        ]
      },
      {
        type: 'icons',
        title: 'Важни аспекти на ДДС',
        items: [
          { icon: 'cash-register', label: 'Включен в цената' },
          { icon: 'office-building', label: 'Отчита се от фирмите' },
          { icon: 'bank', label: 'Превежда се към държавата' },
          { icon: 'chart-line', label: 'Контрол на икономиката' }
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

export default vatLessonTopics; 