
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


export const convertHoursToDecimal =(value) => {
  const val = value.split(':');
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

export const getDateTimeFromString = (date) => {
    date= date?.split(" ");
    if(date?.length > 0){
      let converted_date= date[0]?.split("-");
      if (converted_date?.length === 3) {

        let converted_time=date[1]?.split(":")
        if(converted_time?.length === 3){
          return new Date(parseInt(converted_date[0]), parseInt(converted_date[1]) - 1, parseInt(converted_date[2]), parseInt(converted_time[0]) ,parseInt(converted_time[1]), parseInt(converted_time[2]), 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
        }
        else{
          return new Date(parseInt(converted_date[0]), parseInt(converted_date[1]) - 1, parseInt(converted_date[2]), 0, 0, 0, 0);
        }
      }
    }
  }