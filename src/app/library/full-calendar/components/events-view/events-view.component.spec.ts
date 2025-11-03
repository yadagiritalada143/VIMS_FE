import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EventsViewComponent } from './events-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('EventsViewComponent', () => {
    let component: EventsViewComponent;
    let fixture: ComponentFixture<EventsViewComponent>;
    CommonTestingModule.setUpTestBed(EventsViewComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(EventsViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
