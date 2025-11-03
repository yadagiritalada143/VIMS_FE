
import {debounceTime} from 'rxjs/operators';
import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject ,  Subscription } from 'rxjs';

@Directive({
  selector: '[debounce]'
})
export class DebounceDirective implements OnInit, OnDestroy {

  @Input() public debounce: number;
  @Output() public debounceChange = new EventEmitter<string>();

  private change$ = new Subject<string>();
  private onChangeSubscription: Subscription;

  public ngOnInit() {
    this.onChangeSubscription = this.change$.pipe(
      debounceTime(this.debounce || 500))
      .subscribe((inputValue) => {
        this.debounceChange.emit(inputValue);
      });
  }

  public ngOnDestroy() {
    if (this.onChangeSubscription) {
      this.onChangeSubscription.unsubscribe();
    }
  }

  @HostListener('input', ['$event'])
  private onInput(event) {
    const element = event.target;
    this.change$.next(element.value || element.innerText);
  }
}
