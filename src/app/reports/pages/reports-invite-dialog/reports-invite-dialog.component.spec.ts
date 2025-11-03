import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReportsInviteDialogComponent } from './reports-invite-dialog.component';

describe('ReportsInviteDialogComponent', () => {
  let component: ReportsInviteDialogComponent;
  let fixture: ComponentFixture<ReportsInviteDialogComponent>;
  CommonTestingModule.setUpTestBed(ReportsInviteDialogComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportsInviteDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsInviteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
