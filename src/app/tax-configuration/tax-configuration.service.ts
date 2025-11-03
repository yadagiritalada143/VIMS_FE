import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaxConfigurationService {

  public cityMap: Map <string, string> = new Map <string, string> ();
  public stateMap: Map <string, string> = new Map <string, string> ();
  public countyMap: Map <string, string> = new Map <string, string> ();
  public moduleMap: Map <string, string> = new Map <string, string> ();
  public countryMap: Map <string, string> = new Map <string, string> ();
  public hierarchyMap: Map <string, string> = new Map <string, string> ();
  public workLocationMap: Map <string, string> = new Map <string, string> ();

  constructor() { }

  compareLists(arr1: Array <string>, arr2: Array <string>) {
    
    let result = true;
    arr1.forEach((entry: string) => {
      if(!arr2.includes(entry))
        result = false;
    });

    if(!result)
      return false;

    arr2.forEach((entry: string) => {
      if(!arr1.includes(entry))
        result = false;
    });
  
    return result;

  }
}
