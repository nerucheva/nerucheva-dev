dayjs.extend(dayjs_plugin_isBetween);
const lang = document.documentElement.lang;

dayjs.locale(lang);

const isLangRu = lang === 'ru';
const dateFormat = 'MMMM YYYY';

const today = dayjs();
const birthday = dayjs('1992-01-15');

const getYearsWord = (years, lastDigitOfYears) => {
  switch (true) {
    case years >= 11 && years <= 14:
      return { en: 'years', ru: 'лет' };

    case lastDigitOfYears === 1:
      return { en: 'year', ru: 'год' };

    case lastDigitOfYears >= 2 && lastDigitOfYears <= 4:
      return { en: 'years', ru: 'года' };

    default:
      return { en: 'years', ru: 'лет' };
  }
};

const getMonthsWord = (months, lastDigitOfMonths) => {
  switch (true) {
    case months >= 11 && months <= 14:
      return { en: 'months', ru: 'месяцев' };

    case lastDigitOfMonths === 1:
      return { en: 'month', ru: 'месяц' };

    case lastDigitOfMonths >= 2 && lastDigitOfMonths <= 4:
      return { en: 'months', ru: 'месяца' };

    default:
      return { en: 'months', ru: 'месяцев' };
  }
};

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const countYears = (months) => Math.trunc(months / 12);
const countMonths = (months) => months % 12;

const periodStringLang = (years, months, isAge, isTotalExperience) => {
  const lastDigit = (number) => number % 10;

  const lastDigitOfYears = lastDigit(years);
  const lastDigitOfMonths = lastDigit(months);

  const yearsWord = isAge && !isLangRu ? 'y.o.' : getYearsWord(years, lastDigitOfYears)[lang];
  const monthsWord = getMonthsWord(months, lastDigitOfMonths)[lang];

  if (isAge || months < 1) {
    return `${years} ${yearsWord}`;
  }

  if (years < 1) {
    return `${months} ${monthsWord}`;
  }

  if (isTotalExperience) {
    return `${years} ${yearsWord} ${isLangRu ? 'и' : 'and'} ${months} ${monthsWord}`;
  }

  return `${years} ${yearsWord} ${months} ${monthsWord}`;
};

const periodString = (fromDate, tillDate, isAge, isTotalExperience) => {
  const monthsTotal = tillDate.diff(fromDate, 'month') + 1;

  const years = countYears(monthsTotal);
  const months = countMonths(monthsTotal);

  return periodStringLang(years, months, isAge, isTotalExperience);
};

// Insert age
// const age = document.getElementById('age');
// age.textContent = periodString(birthday, today, true, false);

// Insert positions experience
const positions = document.querySelectorAll('.position-info');

const dates = [];

positions.forEach((position) => {
  const dateStartRaw = position.dataset.dateStart;
  const dateEndRaw = position.dataset.dateEnd;

  dates.push([dateStartRaw, dateEndRaw]);

  const dateStart = dayjs(dateStartRaw);
  const dateEnd = dayjs(dateEndRaw);

  const dateStartFormatted = dateStart.format(dateFormat);
  const dateStartFormattedRu = capitalizeFirstLetter(dateStartFormatted);
  const dateEndFormatted = dateEnd.format(dateFormat);
  const dateEndFormattedRu = capitalizeFirstLetter(dateEndFormatted);

  const todayFormatted = today.format(dateFormat);

  calcDateEndToUse = () => {
    if (dateEndFormatted === todayFormatted) {
      return isLangRu ? 'Наст. время' : 'Present';
    }

    return isLangRu ? dateEndFormattedRu : dateEndFormatted;
  };

  dateStartToUse = isLangRu ? dateStartFormattedRu : dateStartFormatted;
  dateEndToUse = calcDateEndToUse();

  const periodStr = periodString(dateStart, dateEnd, false, false);

  const periodsDesktop = position.querySelectorAll('.period_desktop');
  const periodsMobile = position.querySelectorAll('.period_mobile');

  periodsDesktop.forEach((period) => {
    period.innerHTML = `${dateStartToUse} - ${dateEndToUse} <span>${periodStr}</span>`;
  });

  periodsMobile.forEach((period) => {
    period.innerHTML = `${dateStartToUse} - ${dateEndToUse}`;
  });
});

// Insert total experience
const getTotalMonths = (arr) => {
  const totalMonths = arr.reduce((acc, current, index) => {
    let jobPeriod = 0;

    const currentStartDate = dayjs(current[0]);
    const currentEndDate = dayjs(current[1]);

    const averagePeriodCalculation = currentEndDate.diff(currentStartDate, 'month');

    if (index > 0) {
      const prevJobPeriod = arr[index - 1];
      const prevStartDate = dayjs(prevJobPeriod[0]);
      const prevEndDate = dayjs(prevJobPeriod[1]);

      const startDateIsInPrevPeriod = currentStartDate.isBetween(prevStartDate, prevEndDate, null, '[]');
      const endDateIsInPrevPeriod = currentEndDate.isBetween(prevStartDate, prevEndDate, null, '[]');
      const startDateIsBeforePrevPeriod = currentStartDate.isBefore(prevStartDate, 'month');
      const startEndIsAfterPrevPeriod = currentEndDate.isAfter(prevEndDate, 'month');

      if (startDateIsInPrevPeriod && endDateIsInPrevPeriod) {
        jobPeriod = 0;
      } else if (startDateIsBeforePrevPeriod && startEndIsAfterPrevPeriod) {
        const prevPeriod = prevEndDate.diff(prevStartDate, 'month');
        const currentPeriod = averagePeriodCalculation;

        jobPeriod = currentPeriod - prevPeriod;
      } else if (startDateIsInPrevPeriod) {
        jobPeriod = currentEndDate.diff(prevEndDate, 'month');
      } else if (endDateIsInPrevPeriod) {
        jobPeriod = prevStartDate.diff(currentStartDate, 'month');
      } else if (currentStartDate !== prevEndDate && !startDateIsInPrevPeriod) {
        jobPeriod = averagePeriodCalculation + 1;
      } else {
        jobPeriod = averagePeriodCalculation;
      }
    } else {
      jobPeriod = averagePeriodCalculation;
    }

    return acc + jobPeriod;
  }, 1);

  return totalMonths;
};

const datesSorted = dates.sort();

const uniquePeriods = [];

datesSorted.forEach((element, index) => {
  if (index > 0) {
    prevElement = datesSorted[index - 1];

    if (element.toString() !== prevElement.toString()) {
      uniquePeriods.push(element);
    }
  } else {
    uniquePeriods.push(element);
  }
});

const totalMonths = getTotalMonths(uniquePeriods);

// const exp = document.getElementById('totalExp');

// const totalExpYears = countYears(totalMonths);
// const totalExpMonths = countMonths(totalMonths);

// exp.textContent = periodStringLang(totalExpYears, totalExpMonths, false, true);
