import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SowPendingActionsWidgetComponent } from './sow-pending-actions-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SowPendingActionsWidgetComponent', () => {
  let component: SowPendingActionsWidgetComponent;
  let fixture: ComponentFixture<SowPendingActionsWidgetComponent>;
  CommonTestingModule.setUpTestBed(SowPendingActionsWidgetComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SowPendingActionsWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SowPendingActionsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
