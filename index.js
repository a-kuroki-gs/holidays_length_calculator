#! /usr/bin/env node

import enquirer from "enquirer";
import holiday from '@holiday-jp/holiday_jp';

async function getHolidayName() {
  console.log('*************************');
  console.log('* あなたの休みは何連休？*');
  console.log('*************************');

  const { Select } = enquirer;
  const choices = ['年末年始', 'お盆'];

  const prompt = new Select({
    name: "selections",
    type: "select",
    multiple: false,
    message: `何の休みを計算しますか？:`,
    choices: choices,
  });

  return await prompt.run();
}

async function getFirstDay() {
  const { prompt } = enquirer;

  console.log('開始日について教えてください。')
  const response = await prompt([
    {
      type: "input",
      name: "year",
      message: "何年？",
      initial: 2023,
    },
    {
      type: "input",
      name: "month",
      message: "何月？",
      initial: 1,
    },
    {
      type: "input",
      name: "day",
      message: "何日？",
      initial: 1,
    },
  ]);

  return new Date(response.year, response.month - 1, response.day);
}

async function getLastDay() {
  const { prompt } = enquirer;

  console.log('終了日について教えてください。')
  const response = await prompt([
    {
      type: "input",
      name: "year",
      message: "何年？",
      initial: 2023,
    },
    {
      type: "input",
      name: "month",
      message: "何月？",
      initial: 1,
    },
    {
      type: "input",
      name: "day",
      message: "何日？",
      initial: 1,
    },
  ]);

  return new Date(response.year, response.month - 1, response.day);
}

async function calculateLength(firstDay, lastDay) {
  return (((lastDay - firstDay) / 86400000) + 1); 
}

async function calculateWeekendInclusiveSpan(firstDay, lastDay) {
  // 土日休み
  // 初日が日曜か月曜ならのばす
  switch (firstDay.getDay()){
    case 1:
      firstDay.setDate(firstDay.getDate() - 2);
      break;
    case 0:
      firstDay.setDate(firstDay.getDate() - 1);
      break;
    default:
      firstDay;
  }

  // 最終日が金曜か土曜ならのばす
  switch (lastDay.getDay()){
    case 5:
      lastDay.setDate(lastDay.getDate() + 2);
      break;
    case 6:
      lastDay.setDate(lastDay.getDate() + 1);
      break;
    default:
      lastDay;
  }

  return [firstDay, lastDay];
}

async function calculatePublicHolidayInclusiveSpan(firstDay, lastDay, weekendOff) {
  // 祝日休み
  // 祝日を取得
  const checkStartDay = new Date(firstDay);
  checkStartDay.setDate(firstDay.getDate() - 14);
  const checkEndDay = new Date(lastDay);
  checkEndDay.setDate(lastDay.getDate() + 14);
  const holidays = holiday.between(checkStartDay, checkEndDay);

  // 初日-1の日が祝日かどうかをチェック
  let beforeFirstDay = new Date(firstDay);
  beforeFirstDay.setDate(firstDay.getDate() - 1);
  if (checkPublicHoliday(beforeFirstDay, holidays)){
    // １日前にする
    firstDay = new Date(beforeFirstDay);
  }
  // 最終日+1の日が祝日
  let afterLastDay = new Date(lastDay);
  afterLastDay.setDate(lastDay.getDate() + 1);
  if (checkPublicHoliday(afterLastDay, holidays)){
    // １日後にする
    lastDay = new Date(afterLastDay);
  }
  // 延ばした日の曜日を考慮する
  if (weekendOff) {
    [firstDay, lastDay] = await calculateWeekendInclusiveSpan(firstDay, lastDay);
  }

  beforeFirstDay.setDate(firstDay.getDate() - 1);
  afterLastDay.setDate(lastDay.getDate() + 1);

  if (checkPublicHoliday(beforeFirstDay, holidays) == true || checkPublicHoliday(afterLastDay, holidays) == true) {
    [firstDay, lastDay] = await calculatePublicHolidayInclusiveSpan(firstDay, lastDay, weekendOff);
  }

  return [firstDay, lastDay];
}

function checkPublicHoliday(day, holidays) {
  const checkDay = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
  const result = holidays.some(h => {
    return h.date.getTime() === checkDay.getTime();
  });
  return result;
}

async function isWeekendOff() {
  const { Select } = enquirer;
  const choices = [
                    { name: 'はい', value: true },
                    { name: 'いいえ', value: false }
                  ]

  const prompt = new Select({
    name: "selections",
    type: "select",
    multiple: false,
    message: `土日は休みですか？`,
    choices: choices,
    result() {
      return this.focused.value;
    }
  });

  return await prompt.run();
}

async function isPublicHolidayOff() {
  const { Select } = enquirer;
  const choices = [
                    { name: 'はい', value: true },
                    { name: 'いいえ', value: false }
                  ]

  const prompt = new Select({
    name: "selections",
    type: "select",
    multiple: false,
    message: `祝日は休みですか？`,
    choices: choices,
    result() {
      return this.focused.value;
    }
  });

  return await prompt.run();
}

async function run() {
  const holidayName = await getHolidayName();
  const weekendOff = await isWeekendOff();
  const publicHolidayOff = await isPublicHolidayOff();

  if ( holidayName == '年末年始' ) {
    console.log('年末年始が何連休になるか計算します！');
    let firstDay = await getFirstDay();
    let lastDay = await getLastDay();

    if (publicHolidayOff) {
      [firstDay, lastDay] = await calculatePublicHolidayInclusiveSpan(firstDay, lastDay, weekendOff);
    } else if(weekendOff) {
      [firstDay, lastDay] = await calculateWeekendInclusiveSpan(firstDay, lastDay);
    }

    const period = await calculateLength(firstDay, lastDay);
    console.log(`${firstDay.getFullYear()}年の年末年始は${period}連休です！`);
  } else if (holidayName == 'お盆') {
    console.log('お盆が何連休になるか計算します！');
    const firstDay = await getFirstDay();
    const lastDay = await getLastDay();
    const period = await calculateLength(firstDay, lastDay);
    
    console.log(`${firstDay.getFullYear()}年のお盆休みは${period}連休です！`);
  }
}

run();
