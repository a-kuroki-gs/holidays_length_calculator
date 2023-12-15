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

async function getHolidayPeriod() {
  const { prompt } = enquirer;

  const response = await prompt([
    {
      type: "input",
      name: "year",
      message: "それは何年？(開始日)",
      initial: 2023,
    },
    {
      type: "input",
      name: "firstDay",
      message: "休みの初日は何日？",
      initial: 1,
    },
    {
      type: "input",
      name: "lastDay",
      message: "休みの最終日は何日？",
      initial: 1,
    },
  ]);

  return response;
}

async function calculateLength(firstDay, lastDay) {
  return (((lastDay - firstDay) / 86400000) + 1); 
}

async function run() {
  const holidayName = await getHolidayName();

  if ( holidayName == '年末年始' ) {
    console.log('年末年始が何連休になるか計算します！');
    const holidayPeriod = await getHolidayPeriod();
    const firstDay = new Date(holidayPeriod.year, 11, holidayPeriod.firstDay);
    const lastDay = new Date(Number(holidayPeriod.year) + 1, 0, holidayPeriod.lastDay);
    const period = await calculateLength(firstDay, lastDay);
    
    console.log(`${holidayPeriod.year}年の年末年始は${period}連休です！`);
  } else if (holidayName == 'お盆') {
    console.log('お盆が何連休になるか計算します！');
    const holidayPeriod = await getHolidayPeriod();
    const firstDay = new Date(holidayPeriod.year, 7, holidayPeriod.firstDay);
    const lastDay = new Date(holidayPeriod.year, 7, holidayPeriod.lastDay);
    const period = await calculateLength(firstDay, lastDay);
    
    console.log(`${holidayPeriod.year}年のお盆休みは${period}連休です！`);
  }
}

run();
