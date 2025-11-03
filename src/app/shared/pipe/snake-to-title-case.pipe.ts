import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'snakeToTitleCase'
})
export class SnakeToTitleCasePipe implements PipeTransform {

  transform(snakeCaseString: string , splitOperator: string = "_", onlyFirstLetter: boolean = false): string {
    if (!snakeCaseString) {
      return '';
    }

    let words:Array<string> = [];
    if(onlyFirstLetter) words = snakeCaseString?.split(splitOperator);
    else words = snakeCaseString?.toLowerCase()?.split(splitOperator)
    for (let i = 0; i < words.length; i++) {
      if(words[i]){
      words[i] = words[i][0].toUpperCase() + words[i].slice(1);
      }
    }

    return words.join(' ');
  }

}
