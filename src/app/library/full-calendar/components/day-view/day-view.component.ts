import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ICalendarEvent, IClickPosition } from '../../full-calendar.interfaces';
import { Day } from '../../objects/day';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EventsViewComponent } from '../events-view/events-view.component';

@Component({
    selector: 'app-day-view',
    templateUrl: './day-view.component.html',
    styleUrls: ['./day-view.component.scss']
})

export class DayViewComponent implements OnInit {
    @Input() public maxVisibilityItem = 3;
    @Input() public showEventTime = false;
    @Input() public day: Day;
    @HostListener('click', ['$event']) onClick(event: MouseEvent) {
        if (this.day?.events?.length) {
            this.onEventsInfo(event);
        }
    }

    constructor(private router: Router, private modalService: NgbModal,) { }

    ngOnInit() { }

    public onEventClick(event: ICalendarEvent) {
        const [link, ...query] = event?.link.split('?');
        const queryParams = query ? query.reduce(( acc, cur) => {
            const [name, param] = cur.split('=');
            acc[name] = param;
            return acc;
        }, {}) : {};
        this.router.navigate([link], {queryParams});
    }

    private onEventsInfo(event: MouseEvent) {
        if (this.modalService.hasOpenModals()) {
            this.modalService.dismissAll();
        } else {
            const modalRef = this.modalService.open(EventsViewComponent);
            modalRef.componentInstance.clickPosition = { x: event.pageX, y: event.pageY } as IClickPosition;
            modalRef.componentInstance.day = this.day;
            modalRef.componentInstance.events = this.day?.events;
            modalRef.componentInstance.onClose.subscribe(() => {
                modalRef.dismiss();
            });
        }
    }

    public getItemsToDisplay(): ICalendarEvent[] {
        if (this.isOversize()) {
            return this.day?.events.slice(0, this.maxVisibilityItem - 1);
        } else {
            return this.day?.events;
        }
    }

    public isOversize(): boolean {
        return this.day?.events.length > this.maxVisibilityItem;
    }

    public moreTitle(): string {
        return 'more +' + (this.day?.events.length - (this.maxVisibilityItem - 1));
    }
}
