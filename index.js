#! /usr/bin/env node

import enquirer from "enquirer";

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

async function calculatePublicHolidayInclusiveSpan(firstDay, lastDay, publicHoliday, weekendOff) {
  // 祝日休み
  // 初日-1の日が祝日
  if (publicHoliday.includes(firstDay.toISOString().slice(0, 10))){
    // １日前にする
    firstDay.setDate(firstDay.getDate() - 1);
  }
  // 最終日+1の日が祝日
  if (publicHoliday.includes(lastDay.toISOString().slice(0, 10))){
    // １日後にする
    lastDay.setDate(lastDay.getDate() + 1);
  }

  // 延ばした日の曜日を考慮する
  if (weekendOff == true) {
    calculateWeekendInclusiveSpan(firstDay, lastDay);
  }

  return [firstDay, lastDay];
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
  const publicHoliday = ['2023-12-25', '2024-01-01', '2024-01-08'];
  const publicHolidayOff = await isPublicHolidayOff();

  if ( holidayName == '年末年始' ) {
    console.log('年末年始が何連休になるか計算します！');
    let firstDay = await getFirstDay();
    let lastDay = await getLastDay();

    if (weekendOff == true && publicHolidayOff == true) {
      [firstDay, lastDay] = await calculateWeekendInclusiveSpan(firstDay, lastDay);
      while (publicHoliday.includes(firstDay.toISOString().slice(0, 10)) || publicHoliday.includes(lastDay.toISOString().slice(0, 10))) {
        [firstDay, lastDay] = await calculatePublicHolidayInclusiveSpan(firstDay, lastDay, publicHoliday, weekendOff);
      }
    } else if (weekendOff == true) {
      [firstDay, lastDay] = await calculateWeekendInclusiveSpan(firstDay, lastDay);
    } else if (publicHolidayOff == true) {
      [firstDay, lastDay] = await calculatePublicHolidayInclusiveSpan(firstDay, lastDay, publicHoliday, weekendOff);
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
