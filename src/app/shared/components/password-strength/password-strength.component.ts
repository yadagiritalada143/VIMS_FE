import { Component, OnInit, Input, SimpleChange, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'vms-password-strength',
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss']
})
export class PasswordStrengthComponent implements OnInit {

  @Output() passwordStrengthChanged = new EventEmitter();
  @Input() passwordstrength: any;
  @Input() passwordstrength1 = false;
  @Input() passwordstrength2 = false;
  @Input() passwordstrength3 = false;
  @Input() passwordstrength4 = false;

  constructor() { }

  ngOnInit(): void {
  }
  @Input() passwordToCheck: string;
  @Input() barLabel: string;
  bar0: string;
  bar1: string;
  bar2: string;
  bar3: string;

  private colors = ['#CE0B25', '#FFC409', '#776DE0', '#2DD36F'];

  private static measureStrength(pass: string) {
    let score = 0;
    let variations = {
      pattern: /(?=.*?[a-z])(?=.*?[A-Z])/.test(pass),
      special: /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(pass),
      number: /[0-9]/.test(pass),
      password: (!pass.toUpperCase()?.includes('PASSWORD')),
    };

    let variationCount = 0;
    for (let check in variations) {
      variationCount += (variations[check]) ? 1 : 0;
    }
    score += (variationCount) * 10;
    return Math.trunc(score);
  }

  private getColor(score: number) {
    let idx = 0;
    if (score >= 40) {
      idx = 3;
      this.passwordstrength = 'strong'
    } else if (score >= 30 && score < 40) {
      idx = 2;
      this.passwordstrength = 'good'
    } else if (score >= 20 && score < 30) {
      idx = 1;
      this.passwordstrength = 'fair'
    } else if (score <= 10) {
      this.passwordstrength = 'poor'
    }
    this.passwordStrengthChanged.emit(this.passwordstrength);
    return {
      idx: idx + 1,
      col: this.colors[idx]
    };
  }

  passwordChange(eve) {
    let pattern1 = /(?=.*?[a-z])(?=.*?[A-Z])/;
    let special = /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
    let number = /[0-9]/;
    let password = 'PASSWORD'
    this.passwordstrength1 = eve.length > 7 ? true : false;
    this.passwordstrength2 =
      pattern1.test(eve);
    this.passwordstrength3 =
      (number.test(eve) && special.test(eve))
    this.passwordstrength4 =
      (!eve.toUpperCase()?.includes(password));

   
  }

  ngOnChanges(changes: { [propName: string]: SimpleChange }): void {
    var password = changes['passwordToCheck'].currentValue;
    this.setBarColors(5, '#DDD');
    if (password) {
      let c = this.getColor(PasswordStrengthComponent.measureStrength(password));
      this.passwordChange(password)
      this.setBarColors(c.idx, c.col);
    }
    else {
      this.passwordstrength1 = false;
      this.passwordstrength2 = false;
      this.passwordstrength3 = false;
      this.passwordstrength4 = false;
      this.passwordstrength = '';
    }
  }
  private setBarColors(count, col) {
    for (let _n = 0; _n < count; _n++) {
      this['bar' + _n] = col;
    }
  }

}
