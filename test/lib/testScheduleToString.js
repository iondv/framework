/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 12/22/16.
 */
const scheduleToString = require('core/util/schedule').scheduleToString;

var schedule1 = {
  description: 'Недельное расписание',
  occurs: [
    {
    weekday: 4,
    duration: 5400,
    hour: '03',
    minute: '00'
  },
  {
    weekday: 6,
    duration: 5400,
    hour: '03',
    minute: '00'
  },
  {
    weekday: 1,
    duration: 3600,
    hour: '13',
    minute: '00'
  },
  {
    weekday: 2,
    duration: 3600,
    hour: '13',
    minute: '00'
  },
  {
    weekday: 3,
    duration: 3600,
    hour: '13',
    minute: '00'
  }
],
  skipped: [
  {
    weekday: 4,
    hour: '05',
    minute: '00',
    duration: 36000
  },
  {
    weekday: 6,
    hour: '05',
    minute: '00',
    duration: 36000
  },
  {
    weekday: 1,
    hour: '18',
    minute: '15',
    duration: 5400
  },
  {
    weekday: 2,
    hour: '18',
    minute: '15',
    duration: 5400
  },
  {
    weekday: 3,
    hour: '18',
    minute: '15',
    duration: 5400
  }
]
};

console.log(scheduleToString(schedule1));
