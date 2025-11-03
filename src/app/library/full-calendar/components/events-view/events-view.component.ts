import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { ICalendarEvent, IClickPosition } from '../../full-calendar.interfaces';
import { Day } from '../../objects/day';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-events-view',
    templateUrl: './events-view.component.html',
    styleUrls: ['./events-view.component.scss']
})

export class EventsViewComponent implements OnInit, OnDestroy {
    @Input() public clickPosition: IClickPosition;
    @Input() public day: Day;
    @Input() public events: ICalendarEvent[] = [];
    @Output() onClose: EventEmitter<any> = new EventEmitter();
    private _openedClick: boolean = false;
    private subscription: Subscription;

    constructor(private _router: Router) { }

    ngOnInit() {
        this.subscription = this._router.events.pipe(
            filter(event => event instanceof NavigationStart)).subscribe(
                (event: NavigationStart) => {
                    this.onCloseModal();
                });
    }

    onCloseModal() {
        this.onClose.emit();
    }

    onClickOutside() {
        this._openedClick ? this.onCloseModal() : this._openedClick = true;
    }

    onEventClick(event: ICalendarEvent) {
        this.onCloseModal();
        const [link, ...query] = event?.link.split('?');
        const queryParams = query ? query.reduce(( acc, cur) => {
            const [name, param] = cur.split('=');
            acc[name] = param;
            return acc;
        }, {}) : {};
        this._router.navigate([link], {queryParams});
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
