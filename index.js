#! /usr/bin/env node

import enquirer from "enquirer";
import holiday from "@holiday-jp/holiday_jp";
import readline from "readline";

async function receiveHolidayName() {
  console.log("**************************");
  console.log("* あなたの休みは何連休？ *");
  console.log("**************************");

  const { Select } = enquirer;
  const choices = ["年末年始", "お盆", "その他"];

  const prompt = new Select({
    name: "selections",
    type: "select",
    multiple: false,
    message: `何の休みを計算しますか？:`,
    choices: choices,
  });

  let result = await prompt.run();
  if (result == "その他") {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question("何の休みですか？", (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  return result;
}

async function receiveDate() {
  const { prompt } = enquirer;

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

  return new Date(Date.UTC(response.year, response.month - 1, response.day));
}

async function calculateLength(firstDay, lastDay) {
  return (lastDay - firstDay) / 86400000 + 1;
}

async function adjustWeekendInclusiveSpan(firstDay, lastDay) {
  switch (firstDay.getDay()) {
    // 月曜
    case 1:
      firstDay.setDate(firstDay.getDate() - 2);
      break;
    // 日曜
    case 0:
      firstDay.setDate(firstDay.getDate() - 1);
      break;
    default:
      firstDay;
  }

  switch (lastDay.getDay()) {
    // 金曜
    case 5:
      lastDay.setDate(lastDay.getDate() + 2);
      break;
    // 土曜
    case 6:
      lastDay.setDate(lastDay.getDate() + 1);
      break;
    default:
      lastDay;
  }

  return [firstDay, lastDay];
}

async function adjustPublicHolidayInclusiveSpan(firstDay, lastDay, weekendOff) {
  const checkStartDay = new Date(firstDay);
  checkStartDay.setDate(firstDay.getDate() - 14);
  const checkEndDay = new Date(lastDay);
  checkEndDay.setDate(lastDay.getDate() + 14);
  const holidays = holiday.between(checkStartDay, checkEndDay);

  // 初日の前の日をチェック
  let beforeFirstDay = new Date(firstDay);
  beforeFirstDay.setDate(firstDay.getDate() - 1);
  if (isPublicHoliday(beforeFirstDay, holidays)) {
    // １日前にする
    firstDay = new Date(beforeFirstDay);
  }
  // 最終日の次の日をチェック
  let afterLastDay = new Date(lastDay);
  afterLastDay.setDate(lastDay.getDate() + 1);
  if (isPublicHoliday(afterLastDay, holidays)) {
    lastDay = new Date(afterLastDay);
  }
  // 延ばした日の曜日を考慮する
  if (weekendOff) {
    [firstDay, lastDay] = await adjustWeekendInclusiveSpan(firstDay, lastDay);
  }

  beforeFirstDay.setDate(firstDay.getDate() - 1);
  afterLastDay.setDate(lastDay.getDate() + 1);

  if (
    isPublicHoliday(beforeFirstDay, holidays) ||
    isPublicHoliday(afterLastDay, holidays)
  ) {
    [firstDay, lastDay] = await adjustPublicHolidayInclusiveSpan(
      firstDay,
      lastDay,
      weekendOff,
    );
  }

  return [firstDay, lastDay];
}

function isPublicHoliday(day, holidays) {
  const checkDay = new Date(day);
  const result = holidays.some((h) => {
    return h.date.getTime() === checkDay.getTime();
  });
  return result;
}

async function isDayOff(holiday) {
  const { Select } = enquirer;
  const choices = [
    { name: "はい", value: true },
    { name: "いいえ", value: false },
  ];

  const prompt = new Select({
    name: "selections",
    type: "select",
    multiple: false,
    message: `${holiday}は休みですか？`,
    choices: choices,
    result() {
      return this.focused.value;
    },
  });

  return await prompt.run();
}

async function run() {
  const holidayName = await receiveHolidayName();
  const weekendOff = await isDayOff("土日");
  const publicHolidayOff = await isDayOff("祝日");

  console.log(`${holidayName}が何連休になるか計算します！`);
  console.log("開始日について教えてください。");
  let firstDate = await receiveDate();
  console.log("最終日について教えてください。");
  let lastDate = await receiveDate();

  if (publicHolidayOff) {
    [firstDate, lastDate] = await adjustPublicHolidayInclusiveSpan(
      firstDate,
      lastDate,
      weekendOff,
    );
  } else if (weekendOff) {
    [firstDate, lastDate] = await adjustWeekendInclusiveSpan(
      firstDate,
      lastDate,
    );
  }
  const period = await calculateLength(firstDate, lastDate);
  console.log(
    `${firstDate.getFullYear()}年の${holidayName}は${period}連休です！`,
  );
}

run();
