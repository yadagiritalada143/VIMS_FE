import * as moment from 'moment-timezone';
export const dateRangeToTimeStampConverter = (dateRangeValue,dateFormat?:string) => {
    const timeStampdate = [];
    // added this to support hyphen date format like yyyy-mm-dd
    var startRange = moment(dateRangeValue,dateFormat).format(dateFormat);
    var endRange =moment(dateRangeValue,dateFormat + '-' + dateFormat).format(dateFormat);
    var dateRange = [startRange, endRange]
  for (let i = 0; i <= 1; i++) {
    const date = dateRange[i];
    var dateMomentObject = moment(date, dateFormat); // 1st argument - string, 2nd argument - format
    var dateObject = dateMomentObject.toDate();
    let dateTimestamp = dateObject.getTime();
    timeStampdate.push(dateTimestamp);
  }
  return timeStampdate;
};

export const getDateFromString = (date) => {
  date = date?.split(" ");
  if (date?.length > 0) {
    let converted_date = date[0]?.split("-");
    if (converted_date?.length === 3) {
      return new Date(parseInt(converted_date[0]), parseInt(converted_date[1]) - 1, parseInt(converted_date[2]), 0, 0, 0, 0);
    }
  }
}

export const addDays = (dateString: string, noOfDays: number = 0) => {
  const date = dateString?.split("-");
  if (date?.length === 3) {
    const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
    new_Date.setDate(new_Date.getDate() + noOfDays);
    return new_Date;
  }
  return null;
}
