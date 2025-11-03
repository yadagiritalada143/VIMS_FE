import { HoursDefaultValues, HoursInputType, TimesheetConstants } from "./timesheet.enums";

export const addDays = (dateString: string, noOfDays: number = 0) => {
    const date = dateString?.split("-");
    if (date?.length === 3) {
      const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      new_Date.setDate(new_Date.getDate() + noOfDays);
      return new_Date;
    }
    return null;
  }

export const isEmptyObject = (object) => {
    return (object && Object.keys(object).length === 0 && object.constructor === Object);
}
export const getStartDayOfCalendar = (work_week) => {
  work_week = work_week?.toLowerCase();
  let value = undefined;
  switch (work_week) {
    case "sunday":
      value = 0;
      break;
    case "monday":
      value = 1;
      break;
    case "tuesday":
      value = 2;
      break;
    case "wednesday":
      value = 3;
      break;
    case "thursday":
      value = 4;
      break;
    case "friday":
      value = 5;
      break;
    case "saturday":
      value = 6;
      break;
    default:
      value = 0;
      break;
  }
  return value;
};

export const MonthList =["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"
];

export const getFilteredObjectFromArray = (array, key, value) =>{
  var result = array?.filter(obj => {
    return obj[key] === value;
  });
  return result;    
}

export const formatHoursTime = (str) =>{
  let numberArray = str?.split(":");
  if(numberArray?.length > 0){
    let time =('0'+ (numberArray[0] || 0))?.slice(-2);
    if(numberArray?.length > 1){        
      time += ":" + (numberArray[1]?.length == 2 ? numberArray[1] : (parseInt(numberArray[1] || 0)+'0'));
    }
    if(numberArray?.length > 2){
      time+= ":"+ + (numberArray[2]?.length == 2 ? numberArray[2] : (parseInt(numberArray[2] || 0)+'0'));
    }
    return time;
  }else{
    return str;
  }
}

export const validateHoursFormat = (value, config) => {
  const REGEX= TimesheetConstants.REGEX[config?.hours_input_type?.type?.toLowerCase()]?.[config?.hours_input_type?.format?.toLowerCase()];
  if (config.hours_input_type?.type !== HoursInputType.DECIMAL) {
    if(value?.includes(".")){
      return HoursDefaultValues[config?.hours_input_type?.format];
    }
    value= formatHoursTime(value);
    var time = value?.split(':');
    if (time?.length === 1 && !isNaN(time[0]) && parseInt(time[0]) >= 0
    && parseInt(time[0]) <= 23) {
      const defaultVal= HoursDefaultValues[config?.hours_input_type?.format]?.substring(2) || ':00';
      return time + defaultVal;
    } else if (time.length === 2
      && parseInt(time[0]) >= 0
      && parseInt(time[0]) <= 23
      && parseInt(time[1]) >= 0
      && parseInt(time[1]) <= 59 && REGEX?.test(value)) {
      return value;
    }
    return HoursDefaultValues[config?.hours_input_type?.format];
  } else {      
    if(value?.includes(":")){
      return "0.00";
    }
    var time = value?.split('.');
    if (time.length === 1 && !isNaN(time[0]) && parseInt(time[0]) >= 0 && parseInt(time[0]) <= 23) {
      return time + '.00';
    } else
      if (time.length === 2
        && parseInt(time[0]) >= 0
        && parseInt(time[0]) <= 23
        && parseInt(time[1]) >= 0
        && parseInt(time[1]) <= 99 && REGEX?.test(value)) {
        return parseFloat(value)?.toFixed(2);
      }
    return "0.00";
  }
}

export const convertHoursToDecimal =(value) => {
  const val = value?.split(':');
  if(val?.length > 1){
    const decimal = parseInt(val[0])+parseInt(val[1], 10)/60;
    return val[0] <10 ? '0'+decimal?.toFixed(2) : decimal?.toFixed(2);
    // const decimal = parseInt(""+((val[1] / 60) * 100));
    // return ('0'+val[0])?.slice(-2) + '.' + ('0'+(decimal + '')?.substring(0, 2))?.slice(-2);
  } else {
    return value;
  }
}

export const convertTime12to24 =(time12h) =>{
  if(time12h){
    const [time, modifier] = time12h?.trim()?.split(' ');
    let [hours, minutes, seconds] = time?.split(':');

    if (hours === '12') {
      hours = '00';
    }

    if (modifier?.toUpperCase() === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    if(seconds != undefined && parseInt(seconds) >= 0){
      return `${hours}:${minutes}:${seconds}`;
    } else{
      return `${hours}:${minutes}`;
    }    
  } else {
  return time12h;
}
}

export const sortByKey = (array, key) => {
  return array?.sort(function(a, b) {
      var x = a[key];
      var y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

export const getDateFromString = (date) => {
  date= date?.split(" ");
  if(date?.length > 0){
    let converted_date= date[0]?.split("-");
    if (converted_date?.length === 3) {
      return new Date(parseInt(converted_date[0]), parseInt(converted_date[1]) - 1, parseInt(converted_date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
    }
  }
}

export const grandTotal = (data) => {
  const grandTotal = data?.map(fd => parseFloat(convertHoursToDecimal(fd?.total))).reduce((prev, curr) => prev + curr, 0);
  return grandTotal;
}