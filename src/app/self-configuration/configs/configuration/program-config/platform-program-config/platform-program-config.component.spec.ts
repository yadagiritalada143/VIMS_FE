import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformProgramConfigComponent } from './platform-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('PlatformProgramConfigComponent', () => {
  let component: PlatformProgramConfigComponent;
  let fixture: ComponentFixture<PlatformProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(PlatformProgramConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlatformProgramConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
