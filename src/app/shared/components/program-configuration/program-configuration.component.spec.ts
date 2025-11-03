import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigurationComponent } from './program-configuration.component';

describe('ProgramConfigurationComponent', () => {
  let component: ProgramConfigurationComponent;
  let fixture: ComponentFixture<ProgramConfigurationComponent>;
  CommonTestingModule.setUpTestBed(ProgramConfigurationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
