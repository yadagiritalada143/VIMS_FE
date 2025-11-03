import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MappingService {

  public workLocations: Map <string, string> = new Map <string, string> ();
  public hierarchies: Map <string, string> = new Map <string, string> ();
  public jobTemplates: Map <string, string> = new Map <string, string> ();
  public currencies: Map <string, string> = new Map <string, string> ();

  constructor() { }

}
