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

async function run() {
  const holidayName = await getHolidayName();

  if ( holidayName == '年末年始' ) {
    console.log('年末年始が何連休になるか計算します！');
    const firstDay = await getFirstDay();
    const lastDay = await getLastDay();
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
