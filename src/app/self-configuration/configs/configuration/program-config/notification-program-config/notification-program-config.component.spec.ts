import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationProgramConfigComponent } from './notification-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('NotificationProgramConfigComponent', () => {
  let component: NotificationProgramConfigComponent;
  let fixture: ComponentFixture<NotificationProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(NotificationProgramConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationProgramConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
