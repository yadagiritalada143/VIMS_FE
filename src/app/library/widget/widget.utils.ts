

export const addDays = (dateString: string, noOfDays: number = 0) => {
    const date = dateString?.split("-");
    if (date?.length === 3) {
      const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      new_Date.setDate(new_Date.getDate() + noOfDays);
      return new_Date;
    }
    return null;
  }