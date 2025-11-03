import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-count-down-timer',
  templateUrl: './count-down-timer.component.html',
  styleUrls: ['./count-down-timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountDownTimerComponent implements OnInit, OnChanges {

  @Input() actualDateTIme;
  constructor(private zone: NgZone,private ChangeDetectorRef:ChangeDetectorRef) { }

  displayText;
  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      let interval = setInterval(() => {
        if(!!!this.actualDateTIme) {
          return;
        }
        var now = new Date().getTime();
        var timeleft = this.actualDateTIme.getTime() - now;
        this.updateDisplayText(timeleft);

        if (timeleft < 0) {
            clearInterval(interval);
            this.displayText = "Time is up";
        }
        }, 1000);
    })
  }

  CheckAndUpdateText() {
    if(!!!this.actualDateTIme) {
      return;
    }
    var now = new Date().getTime();
    var timeleft = this.actualDateTIme.getTime() - now;
    this.updateDisplayText(timeleft);
  }

  updateDisplayText(timeleft) {
    let days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
    let hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));

    this.displayText = `${days} D : ${hours} H : ${minutes} M`;
    this.ChangeDetectorRef.detectChanges();
  }

  ngOnChanges() {
    this.CheckAndUpdateText();
  }

}
