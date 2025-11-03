import { HttpErrorResponse } from '@angular/common/http';
export const errorHandler = (httpError: HttpErrorResponse) => {
  let errorMessage = '';
  const ERR_500 = 'Sorry, Internal Server issue, please try after some time.';
  if (httpError.status === 500) {
    errorMessage = ERR_500;
  }

  const err = httpError?.error || {};

  const { error, errors, message } = err;

  if (error) {
    errorMessage = error.message ?
    error.message : error.match(/string=\'([A-z .]+)\',/i) ?
    error.match(/string=\'([A-z .]+)\',/i)[1] : '';
  } else if (errors?.length > 0) {
    if(errors[0].error?.message){
      errorMessage += errors[0].error?.message;
    }else{      
      errorMessage += errors[0]?.message;
    }    
  } else if (message) {
    errorMessage = message
  }

  if (!errorMessage) {
    errorMessage = ERR_500;
  }

  return errorMessage;

};
