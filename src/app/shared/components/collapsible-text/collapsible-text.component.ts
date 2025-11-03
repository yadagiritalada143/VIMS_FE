import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'collapsible-text',
  templateUrl: './collapsible-text.component.html',
  styleUrls: ['./collapsible-text.component.scss']
})
export class CollapsibleTextComponent implements OnInit, OnDestroy {

  @ViewChild("text", { static: true }) textRef: ElementRef;

  @Input() lines: number = 2;

  private subscriptions: Array <Subscription> = [];

  public fontSize: number = 0;
  public textHeight: number = 0; 
  public expanded: boolean = false;

  constructor(
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void {
    this.computeDimensions();

    // Detect window resize actively
    this.subscriptions.push(
      interval(800).subscribe(() => {
        this.computeDimensions();
      })
    );

    this.subscriptions.push(
      this.eventStream.on(Events.SELF_CONFIG_SIDEBAR_TOGGLE)
      .subscribe(() => this.computeDimensions())
    )
  }

  computeDimensions() {
    let elRef: HTMLElement = this.textRef?.nativeElement;
    if(elRef) {
      let cmpStyle: any = window.getComputedStyle(elRef);
      this.fontSize = Number.parseInt(cmpStyle.fontSize) + Number.parseInt(cmpStyle?.lineHeight)/2;
      this.textHeight = elRef?.offsetHeight;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }

  get height(): number {
    return (this.fontSize * this.lines);
  }

  get showCollapsible() {
    return this.height < this.textHeight;
  }
}
