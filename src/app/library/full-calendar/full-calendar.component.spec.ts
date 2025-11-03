import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FullCalendarComponent } from './full-calendar.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FullCalendarComponent', () => {
    let component: FullCalendarComponent;
    let fixture: ComponentFixture<FullCalendarComponent>;
    CommonTestingModule.setUpTestBed(FullCalendarComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(FullCalendarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
