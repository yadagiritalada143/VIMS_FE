import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListWidgetComponent } from './list-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PendingActionsWidgetComponent', () => {
  let component: ListWidgetComponent;
  let fixture: ComponentFixture<ListWidgetComponent>;
  CommonTestingModule.setUpTestBed(ListWidgetComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ListWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
