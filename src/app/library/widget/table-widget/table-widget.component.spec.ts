import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TableWidgetComponent } from './table-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TableWidgetComponent', () => {
  let component: TableWidgetComponent;
  let fixture: ComponentFixture<TableWidgetComponent>;
  CommonTestingModule.setUpTestBed(TableWidgetComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TableWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
